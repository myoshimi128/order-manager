"use client";

import React from "react";
import { OrderRequestWithItem, ORDER_REQUEST_STATUS } from "@/services/orderRequests";

type RequestStatusModalProps = {
  itemName: string;
  requests: OrderRequestWithItem[];
  onClose: () => void;
};

export function RequestStatusModal({
  itemName,
  requests,
  onClose,
}: RequestStatusModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-status-title"
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative"
      >
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
        >
          ✕
        </button>

        <div>
          <h3 id="request-status-title" className="text-base font-bold text-slate-800">
            リクエスト中の詳細
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            対象: <span className="font-bold text-slate-700">{itemName}</span>
          </p>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {requests.length === 0 ? (
            <p className="text-xs text-slate-400">リクエスト情報が見つかりませんでした。</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-slate-700">
                    {req.requester?.name ?? "不明なユーザー"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                      req.status === ORDER_REQUEST_STATUS.APPROVED
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : req.status === ORDER_REQUEST_STATUS.PENDING
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-slate-500">
                  申請数量: {req.request_quantity} {req.items?.unit ?? "個"}
                  {req.created_at && (
                    <>
                      {" "}
                      ／ 申請日時: {new Date(req.created_at).toLocaleString("ja-JP")}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
