"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { AddItemModal } from "@/components/AddItemModal";
import { RejectReasonModal } from "@/components/RejectReasonModal";
import { getCurrentAppUser } from "@/services/auth";
import {
  getOrderRequests,
  updateOrderRequestStatus,
  confirmDelivery,
  formatOrderRequestForAdminUI,
  ORDER_REQUEST_STATUS,
  OrderRequestUIItem,
} from "@/services/orderRequests";

export default function AdminOrderRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<OrderRequestUIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // データ取得・整形を行う共通処理
  // 過去歴（納品済み・却下）は別ページで取得するため、ここでは
  // 承認待ち・納品待ちのみを取得し、増え続ける履歴データの負荷を避ける
  const loadRequests = async () => {
    try {
      const data = await getOrderRequests(
        [ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED],
        { includeRequester: true }
      );

      setRequests(data.map(formatOrderRequestForAdminUI));
    } catch (err) {
      console.error("データ取得エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  // 権限チェック（役職ユーザーのみ許可）→ 通過後に初回ロード
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const currentUser = await getCurrentAppUser();
      if (!isMounted) return;

      if (!currentUser) {
        router.replace("/login");
        return;
      }
      if (currentUser.role !== "役職") {
        router.replace("/supply");
        return;
      }

      await loadRequests();
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 【承認】Supabase上のステータスを「納品待ち」に更新
  const handleOrderComplete = async (id: string, name: string) => {
    try {
      setLoading(true);
      await updateOrderRequestStatus(id, ORDER_REQUEST_STATUS.APPROVED);
      alert(`【承認完了】\n${name} を「納品待ち」に更新しました。`);
      await loadRequests();
    } catch (err) {
      console.error("発注完了エラー:", err);
      alert("発注完了処理に失敗しました。");
      setLoading(false);
    }
  };

  // 【納品確認】現物到着後にステータスを「納品済み」に更新
  const handleConfirmDelivery = async (id: string, name: string) => {
    try {
      setLoading(true);
      await confirmDelivery(id);
      alert(`「${name}」の納品を確認しました。`);
      await loadRequests();
    } catch (err) {
      console.error("納品確認エラー:", err);
      const message = err instanceof Error ? err.message : "納品確認処理に失敗しました。";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // 【却下】理由を添えてステータスを「却下」に更新
  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert("却下理由を入力してください。");
      return;
    }

    setIsRejecting(true);
    try {
      await updateOrderRequestStatus(
        rejectTarget.id,
        ORDER_REQUEST_STATUS.REJECTED,
        trimmedReason
      );
      alert(`「${rejectTarget.name}」のリクエストを却下しました。`);
      setRejectTarget(null);
      await loadRequests();
    } catch (err) {
      console.error("却下エラー:", err);
      alert("却下処理に失敗しました。");
    } finally {
      setIsRejecting(false);
    }
  };

  // 承認待ち／納品待ちに分類（納品済み・却下は /supply/admin/history で扱う）
  const activeRequests = requests.filter(
    (req) => req.status === ORDER_REQUEST_STATUS.PENDING
  );
  const deliveryPendingRequests = requests.filter(
    (req) => req.status === ORDER_REQUEST_STATUS.APPROVED
  );

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
            {/* 過去歴 */}
            <div className="w-32">
              <Button
                href="/supply/admin/history"
                className="border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                🗂️ 過去歴
              </Button>
            </div>

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
                        型番: {req.catalogNo} / 保管場所: {req.location}
                      </p>
                    </div>

                    {/* 数量・現在庫数 */}
                    <div className="flex flex-wrap gap-2">
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
                      <div className="inline-flex items-baseline gap-1 bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-slate-500 font-medium">
                          現在庫数:
                        </span>
                        <span className="text-lg font-black text-slate-800 ml-1">
                          {req.currentStock}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {req.unit}
                        </span>
                      </div>
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
                      {req.purchaseUrl && req.purchaseUrl !== "#" ? (
                        <a
                          href={req.purchaseUrl}
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

                    {/* 却下ボタン */}
                    <div className="w-full md:w-32">
                      <Button
                        onClick={() => setRejectTarget({ id: req.id, name: req.name })}
                        className="border border-slate-200 bg-white text-slate-500 font-bold text-xs py-2.5 hover:bg-red-50 hover:text-red-600"
                      >
                        ✕ 却下
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 納品待ちエリア */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">
              📦 納品待ちの備品
            </span>
            <span className="text-xs font-bold text-slate-500">
              納品待ち: {deliveryPendingRequests.length} 件
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              データを読み込み中...
            </div>
          ) : deliveryPendingRequests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-2xl">📭</div>
              <div className="text-xs font-bold text-slate-400">
                現在、納品待ちの備品はありません。
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deliveryPendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    {req.approvedAt && (
                      <div className="text-xs text-slate-400 font-medium">
                        承認日時: {req.approvedAt}
                      </div>
                    )}
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {req.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      発注数量: {req.quantity} {req.unit} ／ 保管場所: {req.location}
                    </div>
                  </div>
                  <div className="w-full md:w-40 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleConfirmDelivery(req.id, req.name)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      📦 納品完了にする
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 新規備品登録モーダル */}
      <AddItemModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          loadRequests();
        }}
      />

      {/* 却下理由入力モーダル */}
      {rejectTarget && (
        <RejectReasonModal
          itemName={rejectTarget.name}
          isSubmitting={isRejecting}
          onClose={() => setRejectTarget(null)}
          onSubmit={handleReject}
        />
      )}
    </Layout>
  );
}