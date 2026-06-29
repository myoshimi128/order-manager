"use client";

import React, { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";

const allItemsList = [
  { id: "1", name: "コピー用紙 A4", catalog_no: "PPC-A4-500", current_stock: 3, unit: "本" },
  { id: "2", name: "ボールペン（黒）", catalog_no: "BP-BLK-10", current_stock: 12, unit: "本" },
  { id: "3", name: "養生テープ", catalog_no: "YT-50", current_stock: 1, unit: "個" },
  { id: "4", name: "軍手（M）", catalog_no: "GG-M-12P", current_stock: 6, unit: "双" },
  { id: "5", name: "インクカートリッジ BCI-381", catalog_no: "BCI-381PGBK", current_stock: 2, unit: "個" },
  { id: "6", name: "安全靴（27cm）", catalog_no: "SS-270-JIS", current_stock: 4, unit: "足" },
  { id: "7", name: "清掃用モップ", catalog_no: "MOP-60", current_stock: 0, unit: "本" },
];

// フォーム本体
function OrderRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const paramItemId = searchParams.get("itemId");

  // 初期選択アイテムの判定
  const [selectedItemId, setSelectedItemId] = useState(() => {
    if (paramItemId && allItemsList.some(item => item.id === paramItemId)) {
      return paramItemId;
    }
    return allItemsList[0].id;
  });

  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");

  const currentItem = allItemsList.find(item => item.id === selectedItemId);

  // 送信処理
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert(`【申請完了】\n${currentItem?.name} を ${quantity} ${currentItem?.unit} 発注リクエストしました！`);
      router.push("/supply");
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 z-10 relative">
      
      {/* タイトルエリア */}
      <div className="space-y-2">
        <div className="w-36">
          {/* variantを削除してclassNameで白背景ボタンに修正 */}
          <Button href="/supply" className="text-xs text-slate-500 py-1 font-medium bg-white hover:bg-slate-50 border border-slate-200">
            ← 在庫一覧に戻る
          </Button>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wider">発注リクエスト申請</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">NEW ORDER REQUEST</p>
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-sm text-slate-700">
          
          {/* 備品選択 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              発注したい備品 <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm focus:outline-hidden focus:border-brand-blue font-medium"
            >
              {allItemsList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} （型番: {item.catalog_no} / 現在庫: {item.current_stock}{item.unit}）
                </option>
              ))}
            </select>
          </div>

          {/* 数量入力 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              希望発注数量 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-32 bg-slate-50 border border-slate-300 rounded-lg p-3 text-base font-bold text-center focus:outline-hidden focus:border-brand-blue"
              />
              <span className="text-sm font-bold text-slate-500">{currentItem?.unit}</span>
            </div>
          </div>

          {/* コメント入力 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              用途・お急ぎの理由など（コメント）
            </label>
            <textarea 
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例：来週から大きな現場で入用があるので早めに発注します。多めにお願いします。"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs focus:outline-hidden focus:border-brand-blue placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500 leading-relaxed">
            💡 在庫が十分にある状態でも、今後の予定に合わせて自由にリクエストを送信できます。
          </div>

          {/* 下部ボタン */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <div className="w-28">
              {/* キャンセルボタンもvariantを削って通常の白ボタンに修正 */}
              <Button href="/supply" className="text-xs py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600">
                キャンセル
              </Button>
            </div>
            <div className="w-44">
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-brand-dark hover:bg-brand-blue text-white font-semibold text-xs py-2.5 disabled:opacity-50"
              >
                {isPending ? "申請中..." : "発注リクエストを送信"}
              </Button>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}

// ページ全体（Suspenseラップ）
export default function OrderRequestFormPage() {
  return (
    // ✨ 在庫一覧と同じ max-w-7xl を指定してサイズ感を完璧に統一する！
    <Layout className="max-w-7xl space-y-6 my-6">
      <Suspense fallback={
        <div className="flex-1 p-8 flex items-center justify-center text-xs text-slate-400 font-medium">
          読み込み中...
        </div>
      }>
        <OrderRequestForm />
      </Suspense>
    </Layout>
  );
}