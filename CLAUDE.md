# 設計書
## 1. システム概要・アーキテクチャ

- **フロントエンド:** Next.js (App Router) + TypeScript + Tailwind CSS (v4)
- **バックエンド / データベース:** Supabase (Auth / Database)
- **対象ユーザーとコア体験:**
    - **現場/事務所スタッフ:** 在庫確認、**出入庫入力（消費・直接入庫）**、発注リクエスト、納品（検収）入力、および備品の新規登録・マスタ情報の修正。
    - **役員:** リクエストを確認し、1クリックで商品ページへ飛び、承認後1クリックで納品完了とする極小負荷の発注ワークフロー。

---

## 2. データベース設計 (Supabase / PostgreSQL前提)

リレーションの厳格化、および日付型の timestamp 統一を反映した4テーブル構成。

### ① users テーブル (ユーザー管理)

Supabase Authと連携し、現場/役員の画面切り替えの権限根拠となるマスター。

- `id` (uuid, PK): ユーザー固有ID (Supabaseの `auth.users.id` と同期)
- `user_no` (text, Unique): 社員番号
- `name` (text): 社員名
- `role` (text): 権限 ('現場' または '役員')

### ② items テーブル (備品マスター・在庫管理)

マスタ情報の登録・修正、および在庫数・閾値判定のベースとなるテーブル。

- `id` (uuid, PK): 備品固有ID
- `name` (text, NOT NULL): 備品名
- `catalog_no` (text): 型番
- `purchase_url` (text): 購入先URL
- `location` (text, NOT NULL): 保管場所
- `current_stock` (integer, DEFAULT 0): 現在の在庫数
- `threshold_stock` (integer, DEFAULT 1): 適正基準数（下限値）
- `unit` (text, DEFAULT '個'): 単位

### ③ order_requests テーブル (発注リクエスト管理)

役員の入力手間を無くすため、日付関連はシステムが自動記録する timestamp のみに集約。一般ユーザー・管理者のどちらからでも納品完了と在庫加算ができるよう、確認者情報と却下ルートを持つ。

- **id** (uuid, PK): リクエスト固有ID
- **item_id** (uuid, FK): `items(id)` を参照
- **requested_by_user_id** (uuid, FK): `users(id)` を参照
- **status** (text): `'承認待ち'`, `'納品待ち'`, `'納品済み'`, `'却下'` (デフォルト: `'承認待ち'`)
- **created_at** (timestamp): リクエスト日時（初期値 `now()`）
- **approved_at** (timestamp): 役員承認日時（ボタン押下時に自動記録）
- **rejected_at** (timestamp): 役員却下日時（ボタン押下時に自動記録）
- **rejected_reason** (text): 役員による却下理由
- **rejection_acknowledged_at** (timestamp): 申請者が却下内容を確認した日時（「確認しました」ボタン押下時に自動記録。/supply 画面の却下通知表示を消すために使用）
- **delivered_at** (timestamp): 納品(検収)日時（ボタン押下時に自動記録）
- **delivered_by** (uuid, FK): 納品確認者ID。`users(id)` を参照（一般ユーザーまたは役員のIDを記録）
- **comment** (text): 補足コメント（任意）

### ④ stock_logs テーブル (出入庫履歴ログ)

フェーズ2の「AI予測・消費傾向学習」を見据え、出入庫のタイミングと数量、誰が操作したかを正確に蓄積するテーブル。

- `id` (uuid, PK): ログ固有ID
- `item_id` (uuid, FK): `items(id)` を参照
- `log_type` (text, NOT NULL): ログ種別（'消費' または '直接入庫'）
- `quantity_changed` (integer, NOT NULL): 変動数量（常に正の整数。例: 1, 5）
- `logged_by_user_id` (uuid, FK): `users(id)` を参照（誰が操作したか）
- `created_at` (timestamp): 記録日時（初期値 `now()`）

---

## 3. 画面遷移図・ルーティング構成

別画面を増やさず開発コストを下げるため、「新規登録」「情報修正」に加え「出入庫入力」も現場ダッシュボード内でモーダル（ポップアップ）として呼び出す構成。

```
app/
├── page.tsx                        # 0. ルート（ログイン状態・権限に応じて自動リダイレクト）
├── login/page.tsx                  # 1. ログイン画面
└── supply/
    ├── page.tsx                    # 2. 現場用ダッシュボード (在庫一覧・出入庫・却下通知・各種モーダル)
    ├── requests/page.tsx           # 3. 発注リクエスト作成画面
    └── admin/
        ├── page.tsx                # 4. 役員専用・ワンクリック承認/納品管理画面（承認待ち・納品待ちのみ）
        └── history/page.tsx        # 5. 過去歴専用画面（納品済み・却下を月別グルーピング表示）
```

---

## 4. 各画面のUI構成案・主要ロジック

### 画面1: 現場・全体ダッシュボード (app/supply/page.tsx)

- **UI構成:**
    - メインエリアに在庫一覧テーブルを表示。`current_stock <= threshold_stock` の条件を満たす備品は、行を赤くハイライト（アラート通知）。
    - 画面右上等に `[＋ 新規備品登録]` ボタンを配置。
    - 在庫一覧テーブルの各備品の右端（アクション欄）に、`[申請]`、`[消費/入庫]`、`[編集（鉛筆アイコン）]` ボタンを配置。
    - 自分が申請した発注リクエストの状況（承認待ち／納品待ち／却下）を、ステータスごとにダッシュボード上部のパネルで表示する。
        - `承認待ち`: 状態テキストのみ表示。
        - `納品待ち`: **[納品しました]** ボタンを表示。押下時に納品確認ロジックを実行。
        - `却下`: `rejected_reason`（却下理由）付きで表示し、**[確認しました]** ボタンを表示。押下時に `rejection_acknowledged_at` を記録し、以後この表示を消す。
- **出入庫クイックモーダル UI仕様:**
    - `[消費/入庫]` ボタン押下時にポップアップ表示。
    - 現場の利用実態（9割が出庫）に合わせ、**初期状態は「消費モード」かつ「数量：1」が選択された状態**で開く（1個消費であれば開いて即確定が可能）。
    - 1クリックで「直接入庫モード」に切り替えられるトグル/タブを配置。モードに応じてテーマ色（赤/緑など）を変化させ、視覚的に誤入力を防ぐ。
- **動的アクションボタン:**
    - 行が赤くハイライト（在庫少）されている場合、手動でリクエスト画面へ遷移する `[発注リクエスト]` ボタンを表示。
    - 対象備品のリクエスト状態が「承認待ち」または「納品待ち」の場合、状態バッジをクリックするとリクエスト中の詳細（申請者・数量・日時）をモーダルで確認できる。
- **主要ロジック:**
    - **出入庫処理（モーダル確定時）:**
        1. **在庫数更新:** 確定されたモードと数量に基づき、`items.current_stock` を増減（UPDATE）。
        2. **ログ記録:** `stock_logs` テーブルに「対象備品ID、ログ種別（消費/直接入庫）、変動数量、ログインユーザーID」を自動書き込み（INSERT）。
    - **納品処理 (一般・役員共通):** `[納品しました/納品済みにする]` ボタン押下時、`order_requests.status` を `'納品済み'` に更新し、`delivered_at` と操作したユーザーのIDを `delivered_by` に記録。同時に `items.current_stock` にリクエスト数量を加算（UPDATE）する。
    - **新規登録処理:** モーダルから送信された内容を `items` テーブルに新規登録（INSERT）。
    - **修正更新処理:** 選択された備品の `id` を指定し、変更された項目（保管場所やURLなど）のみ `items` テーブルを更新（UPDATE）。

### 画面2: 役員専用・ワンクリック承認画面 (app/supply/admin/page.tsx)

- **UI構成:**
    - タスク消化型UIを維持し、画面上部に「承認待ち」「納品待ち」の2エリアを配置。余計な入力フォームを排除。
    - 「納品済み」「却下」は増え続けるデータのため、このページでは取得・表示せず、別画面（画面3）へ切り出す。ヘッダーに **[🗂️ 過去歴]** ボタンを配置し画面3へ遷移する。
- **各エリアの仕様:**
    - **承認待ち一覧:**
        - `[購入先ページを開く]` ボタン: クリックすると `target="_blank"` で `purchase_url` の外部サイト（Amazon等）を直接開く。
        - `[承認する]` ボタン: `status` を `'納品待ち'` に更新。`approved_at` を自動記録（**この時点では在庫数は更新しない**）。
        - `[却下]` ボタン: 理由入力モーダル（`RejectReasonModal`）を表示し、`status` を `'却下'` に更新。`rejected_at` と `rejected_reason` を記録。
    - **納品待ち一覧:**
        - 本部へ届いた備品を役員側でも完了できるよう、`[納品済みにする]` ボタンを配置（ロジックは画面1の納品処理と共通）。

### 画面3: 過去歴専用画面 (app/supply/admin/history/page.tsx)

- **UI構成:**
    - 「納品済み」「却下」のリクエストのみを取得し、月ごとにグループ化して表示。
    - 各月はアコーディオン形式（クリックで開閉）とし、開いたときのみその月のログテーブル（備品名、発注数量、状態、処理日時＝納品済みは`delivered_at`／却下は`rejected_at`。却下の場合は`rejected_reason`も表示）を展開する。
- **月グルーピングの基準:**
    - 納品済み: `delivered_at` の年月
    - 却下: `rejected_at` の年月
- **役員専用:** 画面2と同じロール判定（`role !== '役職'` は `/supply` へリダイレクト）を適用。

---

## 5. 将来の拡張（フェーズ2: 学習機能への備え）

フェーズ2のAI予測機能の土台として、現場スタッフが出入庫モーダルから操作した履歴を `stock_logs` テーブルへ正確に蓄積する。
AI学習時には `WHERE log_type = '消費'` でフィルタリングを行うことで、突発的な入庫データなどのノイズを除外し、純粋な消費傾向・周期の学習を高精度に行うためのデータクレンジング動線を確保する。

# テーブル定義書
## 1. 備品マスターテーブル (items)

各備品の基本情報を管理します。

| カラム名 (物理名) | 論理名 (日本語) | データ型 | 制約 | 説明 |
| --- | --- | --- | --- | --- |
| **id** | 備品ID | uuid | PRIMARY KEY<br>DEFAULT gen_random_uuid() | 備品を識別する一意のID |
| **name** | 備品名 | text | NOT NULL | 例：養生テープ、コピー用紙 |
| **catalog_no** | 型番 | text | - | メーカー型番やカタログ番号 |
| **purchase_url** | 購入先URL | text | - | Amazonやモノタロウ等の商品ページURL |
| **location** | 保管場所 | text | NOT NULL | 例：事務所 棚A-1、現場 倉庫B |
| **current_stock** | 現在の在庫数 | integer | NOT NULL<br>DEFAULT 0 | 現在手元にある数量（出入庫や納品時に増減） |
| **threshold_stock** | 適正基準数 | integer | NOT NULL<br>DEFAULT 1 | この数値を下回ったらアラート（赤ハイライト）を出す下限値 |
| **unit** | 単位 | text | NOT NULL<br>DEFAULT '個' | 個、箱、巻、足、双 などの単位 |
| **created_at** | 登録日時 | timestamp | DEFAULT now() | 備品がシステムに登録された日時 |

---

## 2. ユーザーテーブル (users)

システムにログインする従業員の情報を管理します（Supabase Authと連携）。

| カラム名 (物理名) | 論理名 (日本語) | データ型 | 制約 | 説明 |
| --- | --- | --- | --- | --- |
| **id** | ユーザーID | uuid | PRIMARY KEY | 従業員を識別する一意のID<br>(Supabaseの `auth.users.id` と同期) |
| **user_no** | ユーザーNo. | text | NOT NULL<br>UNIQUE | ログイン等に用いる社員番号（例：001） |
| **name** | 社員名 | text | NOT NULL | 例：山田 太郎 |
| **role** | 権限 | text | NOT NULL | '現場' または '役員'。画面のアクセス制御に使用 |
| **created_at** | 登録日時 | timestamp | DEFAULT now() | ユーザーアカウント作成日時 |

---

## 3. 発注リクエストテーブル (order_requests)

リクエストの進捗と「誰が」の紐付けを管理します。

| **カラム名 (物理名)** | **論理名 (日本語)** | **データ型** | **制約** | **説明** |
| --- | --- | --- | --- | --- |
| id | リクエストID | uuid | PRIMARY KEY<br>DEFAULT gen_random_uuid() | リクエストを識別する一意のID |
| item_id | 備品ID | uuid | NOT NULL<br>FOREIGN KEY items(id) | どの備品を発注するか |
| request_quantity | 希望発注数量 | integer | NOT NULL | 何個発注してほしいか (CHECK: > 0) |
| status | ステータス | text | NOT NULL<br>DEFAULT '承認待ち' | '承認待ち', '納品待ち', '納品済み', '却下' の4状態を制限 |
| requested_by_user_id | リクエストユーザーID | uuid | NOT NULL<br>FOREIGN KEY users(id) | 申請したユーザーのID |
| comment | コメント | text | - | 発注に関する申請時の補足コメント |
| created_at | 申請日時 | timestamp | NOT NULL<br>DEFAULT now() | リクエストが送信された日時（自動記録） |
| approved_at | 承認日時 | timestamp | - | 役員が「承認」を押した日時（＝発注完了日時） |
| rejected_at | 却下日時 | timestamp | - | 役員が「却下」を押した日時 |
| rejected_reason | 却下理由 | text | - | 役員が却下時に入力した理由テキスト |
| rejection_acknowledged_at | 却下確認日時 | timestamp | - | 申請者が却下内容を確認した日時（/supply 画面の却下通知表示を消す判定に使用） |
| delivered_at | 納品完了日時 | timestamp | - | 一般ユーザーまたは管理者が「納品確認」を押した日時 |
| delivered_by | 納品確認者ID | uuid | FOREIGN KEY users(id) | 最初に「納品確認」ボタンを押した人のユーザーID |

## 4. 出入庫履歴ログテーブル (stock_logs)

フェーズ2の消費傾向分析（AI予測）に向けた、出入庫（消費・直接入庫）履歴の蓄積用テーブルです。

| カラム名 (物理名) | 論理名 (日本語) | データ型 | 制約 | 説明 |
| --- | --- | --- | --- | --- |
| **id** | ログID | uuid | PRIMARY KEY<br>DEFAULT gen_random_uuid() | ログ1件を識別する一意のID |
| **item_id** | 備品ID | uuid | NOT NULL<br>FOREIGN KEY items(id) | 何の備品が動いたか |
| **log_type** | ログ種別 | text | NOT NULL | **'消費' または '直接入庫'** を記録し、データを明確に分類 |
| **quantity_changed** | 変動数量 | integer | NOT NULL | 動いた数量（**常に正の整数。例：1, 5**） |
| **logged_by_user_id** | 操作ユーザーID | uuid | NOT NULL<br>FOREIGN KEY users(id) | 誰が出入庫（消費/直接入庫）を入力したか |
| **created_at** | 記録日時 | timestamp | NOT NULL<br>DEFAULT now() | 出入庫が記録された日時 |
