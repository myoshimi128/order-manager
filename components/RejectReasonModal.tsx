"use client";

import React, { useState } from "react";

type RejectReasonModalProps = {
  itemName: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function RejectReasonModal({
  itemName,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim() === "") {
      alert("却下理由を入力してください。");
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-reason-title"
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 relative"
      >
        <div>
          <h3 id="reject-reason-title" className="text-base font-bold text-slate-800">リクエストを却下</h3>
          <p className="text-xs text-slate-500 mt-1">
            対象: <span className="font-bold text-slate-700">{itemName}</span>
          </p>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="block font-bold text-slate-600">却下理由 *</label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="申請者に伝わる却下理由を入力してください"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-hidden focus:border-brand-blue placeholder:text-slate-400 leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "処理中..." : "却下する"}
          </button>
        </div>
      </div>
    </div>
  );
}
