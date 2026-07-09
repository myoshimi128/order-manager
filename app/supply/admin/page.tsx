"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { AddItemModal } from "@/components/AddItemModal";
import {
  getOrderRequests,
  updateOrderRequestStatus,
  deleteOrderRequest,
} from "@/services/orderRequests";

// Supabaseからの取得レスポンス用の型定義
type OrderRequestResponse = {
  id: string;
  request_quantity: number;
  status: string;
  comment: string | null;
  created_at: string;
  ordered_at: string | null;
  item_id: string;
  items: {
    name: string;
    catalog_no: string | null;
    unit: string;
    location: string;
    purchase_url: string | null;
  } | null;
};

// 画面表示用に整形した型定義
type RequestUIItem = {
  id: string;
  name: string;
  catalog_no: string;
  quantity: number;
  unit: string;
  location: string;
  requester: string;
  comment: string;
  date: string;
  status: string;
  purchase_url: string;
  ordered_at: string | null;
};

export default function AdminOrderRequestsPage() {
  const [requests, setRequests] = useState<RequestUIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // データ取得・整形を行う共通処理
  const loadRequests = async () => {
    try {
      const data = await getOrderRequests();

      const formatted: RequestUIItem[] = (
        (data as unknown as OrderRequestResponse[]) || []
      ).map((item) => {
        const itemDetail = item.items;
        return {
          id: item.id,
          name: itemDetail?.name || "不明な備品",
          catalog_no: itemDetail?.catalog_no || "なし",
          quantity: item.request_quantity || 0,
          unit: itemDetail?.unit || "個",
          location: itemDetail?.location || "保管場所未設定",
          requester: "現場スタッフ",
          comment: item.comment || "なし",
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("ja-JP")
            : "-",
          status: item.status || "リクエスト中",
          purchase_url: itemDetail?.purchase_url || "#",
          ordered_at: item.ordered_at
            ? new Date(item.ordered_at).toLocaleString("ja-JP")
            : null,
        };
      });

      setRequests(formatted);
    } catch (err) {
      console.error("データ取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード（useEffect内での重複を整理しシンプルに呼出）
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const data = await getOrderRequests();
        if (!isMounted) return;

        const formatted: RequestUIItem[] = (
          (data as unknown as OrderRequestResponse[]) || []
        ).map((item) => {
          const itemDetail = item.items;
          return {
            id: item.id,
            name: itemDetail?.name || "不明な備品",
            catalog_no: itemDetail?.catalog_no || "なし",
            quantity: item.request_quantity || 0,
            unit: itemDetail?.unit || "個",
            location: itemDetail?.location || "保管場所未設定",
            requester: "現場スタッフ",
            comment: item.comment || "なし",
            date: item.created_at
              ? new Date(item.created_at).toLocaleDateString("ja-JP")
              : "-",
            status: item.status || "リクエスト中",
            purchase_url: itemDetail?.purchase_url || "#",
            ordered_at: item.ordered_at
              ? new Date(item.ordered_at).toLocaleString("ja-JP")
              : null,
          };
        });

        setRequests(formatted);
      } catch (err) {
        console.error("初期データ取得エラー:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 【発注完了】Supabase上のステータスを「発注済み」に更新
  const handleOrderComplete = async (id: string, name: string) => {
    try {
      setLoading(true);
      await updateOrderRequestStatus(id, "発注済み");
      alert(`【発注処理完了】\n${name} を「発注済み」に更新しました。`);
      await loadRequests();
    } catch (err) {
      console.error("発注完了エラー:", err);
      alert("発注完了処理に失敗しました。");
      setLoading(false);
    }
  };

  // 【削除】Supabaseからデータを削除
  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `【リクエストの削除確認】\n${name} のリクエストを完全に削除しますか？`
    );
    if (confirmDelete) {
      try {
        setLoading(true);
        await deleteOrderRequest(id);
        alert(`「${name}」のリクエストを削除しました。`);
        await loadRequests();
      } catch (err) {
        console.error("削除エラー:", err);
        alert("リクエストの削除に失敗しました。");
        setLoading(false);
      }
    }
  };

  // 未処理と処理済みに分類
  const activeRequests = requests.filter((req) => req.status === "リクエスト中");
  const completedRequests = requests.filter((req) => req.status === "発注済み");

  return (
    <Layout className="max-w-7xl space-y-6 my-6">
      <div className="w-full mx-auto space-y-6 z-10 relative">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-wider">
                発注リクエスト承認管理
              </h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                役職・管理者用
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">
              ORDER REQUEST APPROVAL
            </p>
          </div>
          <div className="flex gap-2">
            {/* 備品登録 */}
            <div className="w-36">
              <Button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-brand-dark hover:bg-brand-blue text-white font-semibold text-sm py-2"
              >
                + 備品登録
              </Button>
            </div>

            {/* ダッシュボードへ戻る */}
            <div className="w-56">
              <Button
                href="/supply"
                className="border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                ← 在庫一覧（ダッシュボード）へ
              </Button>
            </div>
          </div>
        </div>

        {/* メインリスト */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">
              承認待ちのリクエスト 一覧
            </span>
            <span className="text-xs font-bold text-slate-500">
              未処理: {activeRequests.length} 件
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              データを読み込み中...
            </div>
          ) : activeRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-2xl">🎉</div>
              <div className="text-xs font-bold text-slate-400">
                現在、未処理の発注リクエストはありません。
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6"
                >
                  {/* 左側：リクエストの主要情報 */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {req.id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        申請日: {req.date}
                      </span>
                      <span className="text-xs text-slate-500 font-medium bg-slate-100/80 px-2 py-0.5 rounded">
                        申請者: {req.requester}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        {req.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        型番: {req.catalog_no} / 保管場所: {req.location}
                      </p>
                    </div>

                    {/* 数量 */}
                    <div className="inline-flex items-baseline gap-1 bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-slate-500 font-medium">
                        希望発注数:
                      </span>
                      <span className="text-lg font-black text-slate-800 ml-1">
                        {req.quantity}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {req.unit}
                      </span>
                    </div>

                    {/* 現場からのコメント */}
                    <div className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-3 text-xs text-slate-600 leading-relaxed relative">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                        💬 現場からのコメント・理由
                      </div>
                      「{req.comment}」
                    </div>
                  </div>

                  {/* 右側：アクションボタン */}
                  <div className="flex md:flex-col justify-end gap-2 whitespace-nowrap pt-2 md:pt-0">
                    {/* 購入先リンク */}
                    <div className="w-full md:w-32">
                      {req.purchase_url && req.purchase_url !== "#" ? (
                        <a
                          href={req.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-amber-500 text-white font-bold text-xs py-2.5 hover:bg-amber-400 flex items-center justify-center gap-1 rounded-md text-center shadow-xs transition-colors cursor-pointer"
                        >
                          🛒 購入先を開く
                        </a>
                      ) : (
                        <span className="w-full bg-slate-100 text-slate-400 font-bold text-xs py-2.5 flex items-center justify-center rounded-md text-center">
                          URLなし
                        </span>
                      )}
                    </div>

                    {/* 発注完了にする */}
                    <div className="w-full md:w-32">
                      <button
                        type="button"
                        onClick={() => handleOrderComplete(req.id, req.name)}
                        className="w-full bg-brand-dark hover:bg-brand-blue text-white font-bold text-xs py-2.5 rounded-md flex items-center justify-center gap-1 text-center transition-colors cursor-pointer shadow-sm"
                      >
                        👍 発注完了にする
                      </button>
                    </div>

                    {/* 削除ボタン */}
                    <div className="w-full md:w-32">
                      <Button
                        onClick={() => handleDelete(req.id, req.name)}
                        className="border border-slate-200 bg-white text-slate-500 font-bold text-xs py-2.5 hover:bg-red-50 hover:text-red-600"
                      >
                        🗑️ 削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 履歴エリア */}
        {completedRequests.length > 0 && (
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
              ✅ 処理済みのタスク（履歴: {completedRequests.length}件）
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold">
                    <th className="p-4">ID / 備品名</th>
                    <th className="p-4">発注数量</th>
                    <th className="p-4">状態</th>
                    <th className="p-4 text-right">発注完了時刻 (ordered_at)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {completedRequests.map((req) => (
                    <tr key={req.id} className="bg-slate-50/30">
                      <td className="p-4">
                        <span className="font-mono text-slate-400 mr-2">
                          [{req.id.slice(0, 8)}]
                        </span>
                        <span className="font-bold text-slate-700">
                          {req.name}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {req.quantity} {req.unit}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full font-bold text-[10px]">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-400">
                        {req.ordered_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 新規備品登録モーダル */}
      <AddItemModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          loadRequests();
        }}
      />
    </Layout>
  );
}