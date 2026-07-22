"use client";

import { useState } from "react";
import { createItem } from "@/services/item";

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  // 入力値を管理
  const [name, setName] = useState("");
  const [catalogNo, setCatalogNo] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [location, setLocation] = useState("");
  const [unit, setUnit] = useState("個");
  const [currentStock, setCurrentStock] = useState(0);
  const [thresholdStock, setThresholdStock] = useState(1);

  // 送信中のローディング状態
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 登録処理
  const handleRegister = async () => {
    if (!name.trim() || !location.trim()) {
      alert("備品名と保管場所は必須入力です。");
      return;
    }

    setIsSubmitting(true);

    try {
      await createItem({
        name,
        catalog_no: catalogNo || undefined,
        purchase_url: purchaseUrl || undefined,
        location,
        current_stock: currentStock,
        threshold_stock: thresholdStock,
        unit,
      });

      alert(`【登録完了】\n「${name}」を新規登録しました！`);

      // 入力内容をリセット
      setName("");
      setCatalogNo("");
      setPurchaseUrl("");
      setLocation("");
      setUnit("個");
      setCurrentStock(0);
      setThresholdStock(1);

      onClose();
    } catch (error) {
      console.error("備品登録エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative">
        <h3 className="text-base font-bold text-slate-800">
          備品の新規登録
        </h3>

        <div className="space-y-3 text-xs text-slate-700">
          {/* 備品名 */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">
              備品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：コピー用紙 A4"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden"
            />
          </div>

          {/* 型番・単位 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                型番
              </label>
              <input
                type="text"
                value={catalogNo}
                onChange={(e) => setCatalogNo(e.target.value)}
                placeholder="例：PPC-A4-500"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                単位
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="例：個"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 購入先URL */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">
              購入先URL
            </label>
            <input
              type="url"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden"
            />
          </div>

          {/* 保管場所 */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">
              保管場所 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：事務所 棚A-1"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden"
            />
          </div>

          {/* 在庫数・基準在庫 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                現在在庫
              </label>
              <input
                type="number"
                min={0}
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                基準在庫
              </label>
              <input
                type="number"
                min={0}
                value={thresholdStock}
                onChange={(e) => setThresholdStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden font-bold"
              />
            </div>
          </div>
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
            onClick={handleRegister}
            disabled={isSubmitting}
            className="px-4 py-2 bg-brand-dark hover:bg-brand-blue text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "登録中..." : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}