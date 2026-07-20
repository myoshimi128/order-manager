"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { getCurrentAppUser } from "@/services/auth";
import {
  getOrderRequests,
  formatOrderRequestForAdminUI,
  ORDER_REQUEST_STATUS,
  OrderRequestUIItem,
} from "@/services/orderRequests";

export default function AdminOrderHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<OrderRequestUIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // 権限チェック（役職ユーザーのみ許可）→ 通過後に納品済み・却下のみ取得
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

      try {
        const data = await getOrderRequests([
          ORDER_REQUEST_STATUS.DELIVERED,
          ORDER_REQUEST_STATUS.REJECTED,
        ]);
        if (!isMounted) return;
        setHistory(data.map(formatOrderRequestForAdminUI));
      } catch (err) {
        console.error("過去歴の取得エラー:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 納品済みは delivered_at、却下は rejected_at を基準に月ごとへグループ化
  const historyByMonth = useMemo(() => {
    const groups = new Map<string, { label: string; items: OrderRequestUIItem[] }>();

    for (const req of history) {
      const eventDateStr =
        req.status === ORDER_REQUEST_STATUS.DELIVERED
          ? req.deliveredAt
          : req.status === ORDER_REQUEST_STATUS.REJECTED
          ? req.rejectedAt
          : null;
      const eventDate = eventDateStr ? new Date(eventDateStr) : null;

      const monthKey = eventDate
        ? `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`
        : "unknown";
      const monthLabel = eventDate
        ? `${eventDate.getFullYear()}年${eventDate.getMonth() + 1}月`
        : "日時不明";

      if (!groups.has(monthKey)) {
        groups.set(monthKey, { label: monthLabel, items: [] });
      }
      groups.get(monthKey)!.items.push(req);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === "unknown") return 1;
        if (b === "unknown") return -1;
        return b.localeCompare(a);
      })
      .map(([key, value]) => ({ key, ...value }));
  }, [history]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  return (
    <Layout className="max-w-7xl space-y-6 my-6">
      <div className="w-full mx-auto space-y-6 z-10 relative">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-wider">
                過去歴
              </h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                役職・管理者用
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">
              ORDER REQUEST HISTORY
            </p>
          </div>
          <div className="w-56">
            <Button
              href="/supply/admin"
              className="border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              ← 承認管理へ戻る
            </Button>
          </div>
        </div>

        {/* 月別過去歴エリア */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center text-xs text-slate-400 font-medium">
            データを読み込み中...
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center space-y-2">
            <div className="text-2xl">🗂️</div>
            <div className="text-xs font-bold text-slate-400">
              過去歴はまだありません。
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {historyByMonth.map((group) => {
              const isOpen = expandedMonths.has(group.key);
              return (
                <div
                  key={group.key}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleMonth(group.key)}
                    className="w-full px-6 py-3 flex justify-between items-center text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-800">
                      {isOpen ? "▾" : "▸"} {group.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {group.items.length} 件
                    </span>
                  </button>

                  {isOpen && (
                    <table className="w-full text-left border-collapse text-xs border-t border-slate-100">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold">
                          <th className="p-4">ID / 備品名</th>
                          <th className="p-4">発注数量</th>
                          <th className="p-4">状態</th>
                          <th className="p-4 text-right">処理日時</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {group.items.map((req) => (
                          <tr key={req.id} className="bg-slate-50/30">
                            <td className="p-4">
                              <span className="font-bold text-slate-700">
                                {req.name}
                              </span>
                              {req.status === ORDER_REQUEST_STATUS.REJECTED &&
                                req.rejectedReason && (
                                  <div className="text-[10px] text-red-500 font-normal mt-0.5">
                                    却下理由: 「{req.rejectedReason}」
                                  </div>
                                )}
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
                              {req.status === ORDER_REQUEST_STATUS.DELIVERED
                                ? req.deliveredAtLabel ?? "-"
                                : req.rejectedAtLabel ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
