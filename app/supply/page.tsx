"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout"; 
import { Button } from "@/components/Button";
import { getCurrentUser } from "@/services/auth"; // ← getCurrentUser を追加
import { StockModal, Item } from "@/components/StockModal";
import { getItems, recordStockMovement, updateItemDetails } from "@/services/item";

export default function SupplyDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);

  // 出入庫モーダル用ステート
  const [stockItem, setStockItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false); // 保存中のローディング制御

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "alert">("all");
  const [sortKey, setSortKey] = useState<"none" | "stock-asc" | "stock-desc" | "name" | "location">("none");

  // --- 出入庫モーダルを開く処理 ---
  const openStockModal = (item: Item) => {
    setStockItem(item);
  };

  // --- 出入庫の確定ロジック（Supabase & Auth 連携） ---
  const handleSaveStock = async (itemId: string, mode: "消費" | "直接入庫", quantity: number) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    setIsSaving(true);

    try {
      // 1. ログイン中のユーザー情報を取得
      const { data: authData, error: authError } = await getCurrentUser();
      
      if (authError || !authData.user) {
        alert("ログインセッションが切れています。再ログインしてください。");
        return;
      }

      const userId = authData.user.id;

      // 2. 新しい在庫数の計算
      const change = mode === "消費" ? -quantity : quantity;
      const nextStock = Math.max(0, targetItem.current_stock + change);

      // 3. Supabase へ送信 (itemsの更新 ＋ stock_logsの追加)
      await recordStockMovement({
        itemId,
        logType: mode,
        quantityChanged: quantity,
        newStock: nextStock,
        userId: userId,
      });

      // 4. フロントエンド側の表示（State）を更新
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;

          let nextStatus = "正常";
          if (nextStock === 0) {
            nextStatus = "在庫切れ";
          } else if (nextStock <= item.threshold_stock) {
            nextStatus = item.status === "発注済み" ? "発注済み" : "要補充";
          }

          return { ...item, current_stock: nextStock, status: nextStatus };
        })
      );

      // 5. 成功したらモーダルを閉じる
      setStockItem(null);
    } catch (error) {
      console.error("出入庫処理エラー:", error);
      alert("出入庫の記録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: Item) => {
    setEditItem({ ...item });
    setIsEditOpen(true);
  };

  // --- 備品情報編集の保存ロジック (Supabase連携版) ---
  const handleSaveEdit = async () => {
    if (!editItem) return;

    if (!editItem.name.trim() || !editItem.location.trim()) {
      alert("備品名と保管場所は必須入力です。");
      return;
    }

    try {
      // 1. Supabaseの items テーブルを更新
      await updateItemDetails({
        id: editItem.id,
        name: editItem.name,
        catalog_no: editItem.catalog_no,
        unit: editItem.unit,
        location: editItem.location,
      });

      // 2. フロントエンド側の表示（State）を更新
      setItems((prev) =>
        prev.map((item) => (item.id === editItem.id ? { ...editItem } : item))
      );

      // 3. モーダルを閉じる
      setIsEditOpen(false);
      setEditItem(null);
    } catch (error) {
      console.error("備品編集エラー:", error);
      alert("備品情報の更新に失敗しました。もう一度お試しください。");
    }
  };

  // 画面表示時にSupabaseから備品一覧を取得
  useEffect(() => {
    async function fetchItems() {
      try {
        const data = await getItems();

        setItems(
          data.map((item) => ({
            ...item,
            status:
              item.current_stock === 0
                ? "在庫切れ"
                : item.current_stock <= item.threshold_stock
                ? "要補充"
                : "正常",
          }))
        );
      } catch (error) {
        console.error("備品一覧取得エラー:", error);
      }
    }

    fetchItems();
  }, []);

  // 検索・フィルター・ソートを適用する処理
  const processedItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.catalog_no ?? "").toLowerCase().includes(query) ||
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

  // アラート数を計算
  const displayAlertCount = useMemo(() => {
    return processedItems.filter((item) => item.status === "要補充" || item.status === "在庫切れ").length;
  }, [processedItems]);

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
        </div>
      </div>

      {/* 上部サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "該当備品数", count: String(processedItems.length), sub: "件表示中", color: "text-slate-800" },
          { title: "在庫アラート", count: String(displayAlertCount), sub: "件 補充必要", color: "text-red-500" },
          { title: "発注リクエスト中", count: "2", sub: "件 承認待ち", color: "text-slate-800" },
          { title: "今月の納品", count: "3", sub: "件 検収完了", color: "text-slate-800" },
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
                アラートのみ ({items.filter((item) => item.status === "要補充" || item.status === "在庫切れ").length})
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
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={() => openStockModal(item)}
                          className="bg-brand-dark hover:bg-brand-blue text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                        >
                          消費 / 入庫
                        </button>
                        <div className="inline-block w-14">
                          <Button href={`/supply/requests?itemId=${item.id}`} className="bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-blue border border-slate-300 text-xs font-bold py-1 px-2 rounded-md">申請</Button>
                        </div>
                        <button type="button" onClick={() => openEditModal(item)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center cursor-pointer text-xs">✏️</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* 出入庫モーダル */}
      {stockItem && (
        <StockModal
          key={stockItem.id}
          item={stockItem}
          isSaving={isSaving} // 保存中のローディング表示制御
          onClose={() => setStockItem(null)}
          onSave={handleSaveStock}
        />
      )}
    </Layout>
  );
}