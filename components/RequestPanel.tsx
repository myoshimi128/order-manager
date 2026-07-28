"use client";

import React from "react";
import { OrderRequestWithItem } from "@/services/orderRequests";

type RequestPanelColor = "amber" | "blue" | "red";

const COLOR_CLASSES: Record<
  RequestPanelColor,
  { panel: string; count: string; card: string }
> = {
  amber: {
    panel: "bg-amber-50/60 border-amber-100",
    count: "text-amber-600",
    card: "border-amber-100/80",
  },
  blue: {
    panel: "bg-blue-50/60 border-blue-100",
    count: "text-blue-600",
    card: "border-blue-100/80",
  },
  red: {
    panel: "bg-red-50/60 border-red-100",
    count: "text-red-600",
    card: "border-red-100/80",
  },
};

type RequestPanelProps = {
  icon: string;
  color: RequestPanelColor;
  title: string;
  requests: OrderRequestWithItem[];
  renderDetails: (req: OrderRequestWithItem) => React.ReactNode;
  renderAction?: (req: OrderRequestWithItem) => React.ReactNode;
};

// ダッシュボード上部の「申請中」「納品待ち」「却下」の3パネル共通の配色・件数バッジ・
// カード枠のレイアウトをまとめたコンポーネント。備品名の下に出す詳細情報と、
// 右側のアクションボタン（無ければ省略可）は呼び出し元から差し込む。
export function RequestPanel({
  icon,
  color,
  title,
  requests,
  renderDetails,
  renderAction,
}: RequestPanelProps) {
  if (requests.length === 0) return null;

  const classes = COLOR_CLASSES[color];

  return (
    <div className={`rounded-2xl p-5 border space-y-3 ${classes.panel}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">
          {icon} {title}
        </h2>
        <span className={`text-xs font-bold ${classes.count}`}>
          {requests.length} 件
        </span>
      </div>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`bg-white rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${classes.card}`}
          >
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800">
                {req.items?.name ?? "不明な備品"}
              </div>
              {renderDetails(req)}
            </div>
            {renderAction && <div>{renderAction(req)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
