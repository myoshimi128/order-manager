"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import HeaderZaiko from "@/components/HeaderZaiko";
import Footer from "@/components/Footer";

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
  const [items] = useState(initialItems);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof initialItems[0] | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "alert">("all");
  // 【修正】型定義に 'location' を追加
  const [sortKey, setSortKey] = useState<"none" | "stock-asc" | "stock-desc" | "name" | "location">("none");

  const openEditModal = (item: typeof initialItems[0]) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  // 検索・絞り込み・並び替えをまとめて計算
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. 検索
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.catalog_no.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    // 2. 絞り込み
    if (filterMode === "alert") {
      result = result.filter((item) => item.status === "要補充" || item.status === "在庫切れ");
    }

    // 3. 並び替え（ソート）
    if (sortKey === "stock-asc") {
      result.sort((a, b) => a.current_stock - b.current_stock);
    } else if (sortKey === "stock-desc") {
      result.sort((a, b) => b.current_stock - a.current_stock);
    } else if (sortKey === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    } else if (sortKey === "location") {
      // 【新機能】保管場所の50音・アルファベット順ソートロジック
      result.sort((a, b) => a.location.localeCompare(b.location, "ja"));
    }

    return result;
  }, [items, searchQuery, filterMode, sortKey]);

  const alertCount = useMemo(() => {
    return items.filter((item) => item.status === "要補充" || item.status === "在庫切れ").length;
  }, [items]);

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans">
      <HeaderZaiko />

      <main className="flex-1 p-8 bg-(--color-background)" style={{ backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-wider">在庫一覧</h1>
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">STOCK MANAGEMENT</p>
            </div>
            <div className="flex gap-2">
              <Link 
                href="/supply/requests" 
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                📝 発注リクエストを作成
              </Link>
              <button 
                onClick={() => setIsRegisterOpen(true)}
                className="px-4 py-2 bg-(--color-brand-dark) hover:bg-(--color-brand-blue) text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-base font-bold">+</span> 新規備品登録
              </button>
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

          {/* 在庫一覧テーブル＆コントロール群 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 bg-white space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 商品名・型番・保管場所で検索" 
                  className="w-full max-w-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-(--color-brand-blue) transition-colors"
                />

                <div className="bg-slate-100 p-0.5 rounded-lg flex border border-slate-200 text-xs font-bold">
                  <button 
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-md transition-all ${filterMode === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    すべて ({items.length})
                  </button>
                  <button 
                    onClick={() => setFilterMode("alert")}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${filterMode === "alert" ? "bg-red-500 text-white shadow-xs" : "text-red-500 hover:bg-slate-50"}`}
                  >
                    ⚠️ アラートのみ ({alertCount})
                  </button>
                </div>
              </div>

              {/* 右側：並び替えセレクトボックス */}
              <div className="flex items-center gap-2 justify-end whitespace-nowrap text-xs">
                <span className="text-slate-500 font-bold">並び替え:</span>
                <select 
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium focus:outline-hidden focus:border-(--color-brand-blue)"
                >
                  <option value="none">標準（登録順）</option>
                  <option value="stock-asc">在庫の少ない順 ↑</option>
                  <option value="stock-desc">在庫の多い順 ↓</option>
                  <option value="name">備品名（50音順）</option>
                  {/* 【修正】選択肢を追加 */}
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
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                        該当する備品が見つかりませんでした。
                      </td>
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
                              item.status === "要補充" ? "bg-orange-50 text-orange-600 border-orange-100" :
                              "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <Link 
                              href={`/supply/requests?itemId=${item.id}`} 
                              className="px-2 py-1 border border-slate-300 hover:border-(--color-brand-blue) hover:bg-slate-50 text-slate-600 hover:text-(--color-brand-blue) text-xs font-bold rounded-md transition-all inline-block cursor-pointer"
                            >
                              申請
                            </Link>
                            <button 
                              onClick={() => openEditModal(item)}
                              title="編集"
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center cursor-pointer text-xs"
                            >
                              ✏️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 新規登録・編集モーダル（状態維持のため省略なしでそのまま保持） */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative">
            <button onClick={() => setIsRegisterOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
            <div>
              <h3 className="text-base font-bold text-slate-800">備品の新規登録</h3>
            </div>
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
              <button onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 bg-(--color-brand-dark) text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">登録する</button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 relative">
            <button onClick={() => { setIsEditOpen(false); setSelectedItem(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
            <div>
              <h3 className="text-base font-bold text-slate-800">備品情報の編集</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-600 mb-1">備品名 *</label>
                <input type="text" defaultValue={selectedItem.name} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => { setIsEditOpen(false); setSelectedItem(null); }} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer">キャンセル</button>
              <button onClick={() => { setIsEditOpen(false); setSelectedItem(null); }} className="px-4 py-2 bg-(--color-brand-dark) text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">保存する</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}