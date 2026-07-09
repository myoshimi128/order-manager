"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { getItems } from "@/services/item";
import { getCurrentUser } from "@/services/auth";
import { createOrderRequest } from "@/services/orderRequests";

// 画面内で使うアイテムの型定義
type ItemOption = {
  id: string;
  name: string;
  catalog_no?: string | null;
  current_stock: number;
  unit: string;
};

// フォーム本体
function OrderRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(true);

  const paramItemId = searchParams.get("itemId");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");

  // 1. 画面読み込み時に Supabase から実際の備品一覧（items）を取得
  useEffect(() => {
    async function fetchItems() {
      try {
        const data = await getItems();
        setItems(data);

        // URLパラメータ（itemId）があればその備品を初期選択、無ければ1番目の備品を選択
        if (paramItemId && data.some((item) => item.id === paramItemId)) {
          setSelectedItemId(paramItemId);
        } else if (data.length > 0) {
          setSelectedItemId(data[0].id);
        }
      } catch (error) {
        console.error("備品一覧の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [paramItemId]);

  const currentItem = items.find((item) => item.id === selectedItemId);

  // 2. 送信処理（Supabase の order_requests テーブルへ保存）
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedItemId) {
      alert("備品を選択してください。");
      return;
    }

    startTransition(async () => {
      try {
        // ログインユーザーのIDを取得
        const { data: authData, error: authError } = await getCurrentUser();

        if (authError || !authData.user) {
          alert("ログインセッションが切れています。再ログインしてください。");
          return;
        }

        // Supabaseへ申請データを保存
        await createOrderRequest({
          itemId: selectedItemId,
          requestQuantity: quantity,
          userId: authData.user.id,
          comment: comment,
        });

        alert(`【申請完了】\n${currentItem?.name} を ${quantity} ${currentItem?.unit} 発注リクエストしました！`);
        router.push("/supply");
      } catch (error) {
        console.error("発注リクエストエラー:", error);
        alert("リクエストの送信に失敗しました。もう一度お試しください。");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-xs text-slate-400 font-medium">
        データを読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 z-10 relative">
      {/* タイトルエリア */}
      <div className="space-y-2">
        <div className="w-36">
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
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} （型番: {item.catalog_no || "なし"} / 現在庫: {item.current_stock}{item.unit}）
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