"use client";

import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout"; 
import { Button } from "@/components/Button";

const initialItems = [
  { id: "1", name: "コピー用紙 A4", catalog_no: "PPC-A4-500", location: "事務所 棚A-1", current_stock: 3, threshold_stock: 5, unit: "本", status: "要補充" },
  { id: "2", name: "ボールペン（黒）", catalog_no: "BP-BLK-10", location: "事務所 棚A-2", current_stock: 12, threshold_stock: 5, unit: "本", status: "正常" },
  { id: "3", name: "養生テープ", catalog_no: "YT-50", location: "現場 倉庫B", current_stock: 1, threshold_stock: 3, unit: "個", status: "発注済み" },
  { id: "4", name: "軍手（M）", catalog_no: "GG-M-12P", location: "現場 倉庫B", current_stock: 6, threshold_stock: 10, unit: "双", status: "要補充" },
  { id: "5", name: "インクカートリッジ BCI-381", catalog_no: "BCI-381PGBK", location: "事務所 棚A-3", current_stock: 2, threshold_stock: 2, unit: "個", status: "発注済み" },
  { id: "6", name: "安全靴（27cm）", catalog_no: "SS-270-JIS", location: "現場 倉庫A", current_stock: 4, threshold_stock: 2, unit: "足", status: "正常" },
  { id: "7", name: "清掃用モップ", catalog_no: "MOP-60", location: "現場 倉庫C", current_stock: 0, threshold_stock: 1, unit: "本", status: "在庫切れ" },
];

export default function SupplyDashboard() {
  const [items, setItems] = useState(initialItems);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<typeof initialItems[0] | null>(null);

  // --- 【追加】出入庫モーダル用のステート管理 ---
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState<typeof initialItems[0] | null>(null);
  const [stockMode, setStockMode] = useState<"消費" | "直接入庫">("消費"); // 9割が出庫なのでデフォルト「消費」
  const [stockQuantity, setStockQuantity] = useState(1); // 初期数は 1

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "alert">("all");
  const [sortKey, setSortKey] = useState<"none" | "stock-asc" | "stock-desc" | "name" | "location">("none");

  // --- 【追加】出入庫モーダルを開く処理 ---
  const openStockModal = (item: typeof initialItems[0]) => {
    setStockItem({ ...item });
    setStockMode("消費"); // 開く時は常に消費モードにする
    setStockQuantity(1);  // 数量も1にリセット
    setIsStockModalOpen(true);
  };

  // --- 【追加】出入庫の確定ロジック ---
  const handleSaveStock = () => {
    if (!stockItem) return;

    // 変動量を計算（消費ならマイナス、入庫ならプラス）
    const change = stockMode === "消費" ? -stockQuantity : stockQuantity;
    const nextStock = Math.max(0, stockItem.current_stock + change);

    // 新しい在庫数に基づいてステータスを自動判定するロジック
    let nextStatus = "正常";
    if (nextStock === 0) {
      nextStatus = "在庫切れ";
    } else if (nextStock <= stockItem.threshold_stock) {
      // もともと「発注済み」状態なら、消費しても「発注済み」のまま維持する方が自然
      nextStatus = stockItem.status === "発注済み" ? "発注済み" : "要補充";
    }

    // 1. 画面上のステートを即時更新
    setItems((prev) =>
      prev.map((item) =>
        item.id === stockItem.id
          ? { ...item, current_stock: nextStock, status: nextStatus }
          : item
      )
    );

    // 2. 【TODO】ここに後からSupabaseへの保存処理を書き込む
    // - itemsテーブルの current_stock を UPDATE
    // - stock_logsテーブルに log_type, quantity_changed(stockQuantity), logged_by_user_id 等を INSERT
    console.log(`Supabase保存用: ID=${stockItem.id}, モード=${stockMode}, 変動数=${stockQuantity}`);

    setIsStockModalOpen(false);
    setStockItem(null);
  };

  const openEditModal = (item: typeof initialItems[0]) => {
    setEditItem({ ...item });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    setItems((prev) => prev.map((item) => (item.id === editItem.id ? editItem : item)));
    setIsEditOpen(false);
    setEditItem(null);
  };

  const processedItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.catalog_no.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }
    if (filterMode === "alert") {
      result = result.filter((item) => item.status === "要補充" || item.status === "在庫切れ");
    }
    if (sortKey === "stock-asc") result.sort((a, b) => a.current_stock - b.current_stock);
    else if (sortKey === "stock-desc") result.sort((a, b) => b.current_stock - a.current_stock);
    else if (sortKey === "name") result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    else if (sortKey === "location") result.sort((a, b) => a.location.localeCompare(b.location, "ja"));
    return result;
  }, [items, searchQuery, filterMode, sortKey]);

  const alertCount = useMemo(() => items.filter((item) => item.status === "要補充" || item.status === "在庫切れ").length, [items]);

  return (
    <Layout className="max-w-7xl space-y-6 my-6">
      
      {/* ヘッダーエリア */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wider">在庫一覧</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">STOCK MANAGEMENT</p>
        </div>
        <div className="flex gap-2">
          <div className="w-44">
            <Button href="/supply/requests" className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2 border border-slate-300">
              📝 発注リクエストを作成
            </Button>
          </div>
          <div className="w-36">
            <Button onClick={() => setIsRegisterOpen(true)} className="bg-brand-dark hover:bg-brand-blue text-white font-semibold text-sm py-2">
              + 新規備品登録
            </Button>
          </div>
        </div>
      </div>

      {/* 上部サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "総備品数", count: String(items.length), sub: "件登録済み", color: "text-slate-800" },
          { title: "在庫アラート", count: String(alertCount), sub: "件 補充必要", color: "text-red-500" },
          { title: "発注リクエスト中", count: "2", sub: "件 承認待ち", color: "text-slate-800" },
          { title: "今月の納品", count: "3", sub: "件 検収完了", color: "text-slate-800" }
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-500">{card.title}</div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-3xl font-bold ${card.color}`}>{card.count}</span>
              <span className="text-xs text-slate-400">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* コントロール・テーブルエリア */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-white space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 商品名・型番・保管場所で検索" 
              className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-brand-blue transition-colors"
            />
            <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200 text-xs font-bold">
              <button onClick={() => setFilterMode("all")} className={`px-3 py-1.5 rounded-md transition-all ${filterMode === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                すべて ({items.length})
              </button>
              <button onClick={() => setFilterMode("alert")} className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${filterMode === "alert" ? "bg-red-500 text-white shadow-xs" : "text-red-500 hover:bg-slate-50"}`}>
                アラートのみ ({alertCount})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end whitespace-nowrap text-xs">
            <span className="text-slate-500 font-bold">並び替え:</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:outline-hidden focus:border-brand-blue">
              <option value="none">標準（登録順）</option>
              <option value="stock-asc">在庫の少ない順 ↑</option>
              <option value="stock-desc">在庫の多い順 ↓</option>
              <option value="name">備品名（50音順）</option>
              <option value="location">保管場所（50音順）</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 font-semibold">備品名 / 型番</th>
                <th className="px-6 py-3 font-semibold">保管場所</th>
                <th className="px-6 py-3 font-semibold">在庫数</th>
                <th className="px-6 py-3 font-semibold">基準数</th>
                <th className="px-6 py-3 font-semibold">状態</th>
                <th className="px-6 py-3 font-semibold text-right">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {processedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">該当する備品が見つかりませんでした。</td>
                </tr>
              ) : (
                processedItems.map((item) => {
                  const isAlert = item.status === "要補充" || item.status === "在庫切れ";
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isAlert ? "bg-red-50/20" : ""}`}>
                      <td className="px-6 py-4">
                        <div className={`font-bold ${isAlert ? "text-red-600" : "text-slate-800"}`}>{item.name}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">{item.catalog_no}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.location}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className={isAlert ? "text-red-500" : "text-slate-800"}>{item.current_stock}</span>
                        <span className="text-xs text-slate-400 font-normal ml-0.5">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{item.threshold_stock} {item.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          item.status === "正常" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          item.status === "発注済み" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          item.status === "要補充" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-red-100 text-red-700 border-red-200"
                        }`}>{item.status}</span>
                      </td>
                      {/* アクションカラムのボタン配置を調整 */}
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => openStockModal(item)}
                          className="bg-brand-dark hover:bg-brand-blue text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                        >
                          消費 / 入庫
                        </button>
                        <div className="inline-block w-14">
                          <Button href={`/supply/requests?itemId=${item.id}`} className="bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-blue border border-slate-300 text-xs font-bold py-1 px-2 rounded-md">申請</Button>
                        </div>
                        <button onClick={() => openEditModal(item)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center cursor-pointer text-xs">✏️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規登録モーダル */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative">
            <button onClick={() => setIsRegisterOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
            <h3 className="text-base font-bold text-slate-800">備品の新規登録</h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-600 mb-1">備品名 *</label>
                <input type="text" placeholder="例：コピー用紙 A4" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">型番</label>
                  <input type="text" placeholder="例：PPC-A4-500" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">単位</label>
                  <input type="text" placeholder="包" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">保管場所 *</label>
                <input type="text" placeholder="例：事務所 棚A-1" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer">キャンセル</button>
              <button onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">登録する</button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {isEditOpen && editItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative">
            <button onClick={() => { setIsEditOpen(false); setEditItem(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
            <h3 className="text-base font-bold text-slate-800">備品情報の編集</h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-600 mb-1">備品名 *</label>
                <input type="text" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">型番</label>
                  <input type="text" value={editItem.catalog_no || ""} onChange={(e) => setEditItem({ ...editItem, catalog_no: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">単位</label>
                  <input type="text" value={editItem.unit} onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">保管場所 *</label>
                <input type="text" value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => { setIsEditOpen(false); setEditItem(null); }} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer">キャンセル</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* --- 【追加】出入庫クイックモーダル (ポップアップ) --- */}
      {isStockModalOpen && stockItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* ヘッダー */}
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{stockItem.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">現在の在庫: <span className="font-bold text-slate-700">{stockItem.current_stock}</span> {stockItem.unit}</p>
            </div>

            {/* メインエリア */}
            <div className="p-5 space-y-5">
              {/* モード選択タブ（現場ファーストな出庫デフォルト設計） */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">処理を選択</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setStockMode("消費")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      stockMode === "消費" ? "bg-red-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🔴 消費 (出庫)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode("直接入庫")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      stockMode === "直接入庫" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🟢 直接入庫
                  </button>
                </div>
              </div>

              {/* 数量カウンター */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">数量 ({stockItem.unit})</label>
                <div className="flex items-center justify-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    disabled={stockQuantity <= 1}
                    onClick={() => setStockQuantity(q => q - 1)}
                    className="w-10 h-10 bg-white border border-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shadow-xs"
                  >
                    －
                  </button>
                  <span className="text-lg font-bold w-12 text-center text-slate-800 font-mono">{stockQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setStockQuantity(q => q + 1)}
                    className="w-10 h-10 bg-white border border-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
                  >
                    ＋
                  </button>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setIsStockModalOpen(false); setStockItem(null); }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                className={`px-5 py-2 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer ${
                  stockMode === "消費" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                {stockMode === "消費" ? "消費を確定する" : "入庫を確定する"}
              </button>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
}