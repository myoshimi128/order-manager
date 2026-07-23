"use client";

import React, { useState } from "react";
import { Modal } from "@/components/Modal";

// DB構成に合わせて status カラムを除外した Item 型
export type Item = {
  id: string;
  name: string;
  catalog_no?: string | null;
  location: string;
  current_stock: number;
  threshold_stock: number;
  unit: string;
};

type StockModalProps = {
  item: Item;
  isSaving?: boolean; // 保存中の連打防止フラグ
  allowStockIn?: boolean; // false の場合は「直接入庫」モードを使わせない（消費のみ）
  onClose: () => void;
  onSave: (itemId: string, mode: "消費" | "直接入庫", quantity: number) => void;
};

export function StockModal({
  item,
  isSaving = false,
  allowStockIn = true,
  onClose,
  onSave,
}: StockModalProps) {
  const [stockMode, setStockMode] = useState<"消費" | "直接入庫">("消費");
  const [quantity, setQuantity] = useState<number>(1);

  // allowStockIn が false の間は、stockMode の値に関わらず常に「消費」として扱う
  // （stateとして同期するのではなく描画のたびに導出する）
  const effectiveMode = allowStockIn ? stockMode : "消費";

  const handleSave = () => {
    if (quantity <= 0) {
      alert("1以上の数量を入力してください。");
      return;
    }
    onSave(item.id, effectiveMode, quantity);
  };

  return (
    <Modal
      titleId="stock-modal-title"
      title="出入庫の記録"
      subtitle={
        <>
          対象: <span className="font-bold text-slate-700">{item.name}</span> （現在: {item.current_stock}{item.unit}）
        </>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className={`px-5 py-2 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
              effectiveMode === "消費" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isSaving ? "保存中..." : effectiveMode === "消費" ? "消費を確定する" : "入庫を確定する"}
          </button>
        </>
      }
    >
      {/* モード切り替え（消費のみ許可の場合はトグル自体を表示しない） */}
      {allowStockIn ? (
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setStockMode("消費")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              stockMode === "消費" ? "bg-white text-red-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔴 消費 (減らす)
          </button>
          <button
            type="button"
            onClick={() => setStockMode("直接入庫")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              stockMode === "直接入庫" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🟢 直接入庫 (増やす)
          </button>
        </div>
      ) : (
        <div className="bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <div className="py-2 rounded-lg bg-white text-red-600 shadow-xs text-center">
            🔴 消費 (減らす)
          </div>
        </div>
      )}

      {/* 数量入力 */}
      <div className="space-y-1.5 text-xs">
        <label className="block font-bold text-slate-600">
          {effectiveMode === "消費" ? "消費数量" : "入庫数量"} ({item.unit}) *
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold focus:outline-hidden focus:border-brand-blue"
        />
      </div>
    </Modal>
  );
}
