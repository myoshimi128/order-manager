"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { getCurrentUser, getCurrentAppUser } from "@/services/auth";
import { type User } from "@/services/users";
import { StockModal, Item } from "@/components/StockModal";
import { RequestStatusModal } from "@/components/RequestStatusModal";
import { Modal } from "@/components/Modal";
import { RequestPanel } from "@/components/RequestPanel";
import { 
  getItems, 
  recordStockMovement, 
  updateItemDetails, 
  getItemStatus,
  ItemStatusInfo 
} from "@/services/item";
import {
  getOrderRequests,
  confirmDelivery,
  acknowledgeRejection,
  OrderRequestWithItem,
  ORDER_REQUEST_STATUS,
} from "@/services/orderRequests";

export default function SupplyDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [requestedItemIds, setRequestedItemIds] = useState<Set<string>>(new Set());
  const [myPendingRequests, setMyPendingRequests] = useState<
    OrderRequestWithItem[]
  >([]);
  const [myDeliveryPendingRequests, setMyDeliveryPendingRequests] = useState<
    OrderRequestWithItem[]
  >([]);
  const [myRejectedRequests, setMyRejectedRequests] = useState<
    OrderRequestWithItem[]
  >([]);
  const [confirmingRequestId, setConfirmingRequestId] = useState<string | null>(null);
  const [acknowledgingRequestId, setAcknowledgingRequestId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<User["role"] | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  // 「リクエスト中」詳細モーダル用ステート（クリック時にその備品分だけ遅延取得する）
  const [requestStatusItem, setRequestStatusItem] = useState<Item | null>(null);
  const [requestStatusRequests, setRequestStatusRequests] = useState<OrderRequestWithItem[]>([]);
  const [isLoadingRequestStatus, setIsLoadingRequestStatus] = useState(false);

  // 出入庫モーダル用ステート
  const [stockItem, setStockItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "alert">("all");
  const [sortKey, setSortKey] = useState<"none" | "stock-asc" | "stock-desc" | "name" | "location">("location");

  // --- 出入庫モーダルを開く処理 ---
  const openStockModal = (item: Item) => {
    setStockItem(item);
  };

  // --- 出入庫の確定ロジック ---
  const handleSaveStock = async (itemId: string, mode: "消費" | "直接入庫", quantity: number) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    setIsSaving(true);

    try {
      const { data: authData, error: authError } = await getCurrentUser();
      
      if (authError || !authData.user) {
        alert("ログインセッションが切れています。再ログインしてください。");
        return;
      }

      const userId = authData.user.id;

      const change = mode === "消費" ? -quantity : quantity;
      const nextStock = Math.max(0, targetItem.current_stock + change);

      await recordStockMovement({
        itemId,
        logType: mode,
        quantityChanged: quantity,
        previousStock: targetItem.current_stock,
        newStock: nextStock,
        userId: userId,
      });

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, current_stock: nextStock };
        })
      );

      setStockItem(null);
    } catch (error) {
      console.error("出入庫処理エラー:", error);
      const message =
        error instanceof Error
          ? error.message
          : "出入庫の記録に失敗しました。もう一度お試しください。";
      alert(message);
      // 在庫が他の操作で変わっている可能性があるため最新状態を再取得する
      try {
        const latestItems = await getItems();
        setItems(latestItems);
        // 出入庫モーダルが開いている場合は表示中の在庫数も最新に合わせる
        setStockItem((prev) =>
          prev ? latestItems.find((i) => i.id === prev.id) ?? prev : prev
        );
      } catch (refetchError) {
        console.error("在庫再取得エラー:", refetchError);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (item: Item) => {
    setEditItem({ ...item });
    setIsEditOpen(true);
  };

  // --- 備品情報編集の保存ロジック ---
  const handleSaveEdit = async () => {
    if (!editItem) return;

    if (!editItem.name.trim() || !editItem.location.trim()) {
      alert("備品名と保管場所は必須入力です。");
      return;
    }

    try {
      await updateItemDetails({
        id: editItem.id,
        name: editItem.name,
        catalog_no: editItem.catalog_no,
        unit: editItem.unit,
        location: editItem.location,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === editItem.id ? { ...editItem } : item))
      );

      setIsEditOpen(false);
      setEditItem(null);
    } catch (error) {
      console.error("備品編集エラー:", error);
      alert("備品情報の更新に失敗しました。もう一度お試しください。");
    }
  };

  // 取得済みのリクエスト一覧から画面表示用の状態を組み立てる共通処理
  const applyRequestsData = (
    allRequests: OrderRequestWithItem[],
    userId: string | null
  ) => {
    // 未完了（承認待ち / 納品待ち）のリクエストがある item_id を抽出
    const activeItemIds = new Set<string>(
      allRequests
        .filter(
          (req) =>
            req.status === ORDER_REQUEST_STATUS.PENDING ||
            req.status === ORDER_REQUEST_STATUS.APPROVED
        )
        .map((req) => req.item_id)
    );
    setRequestedItemIds(activeItemIds);

    // 自分が申請し、まだ承認されていない（承認待ち）リクエストを抽出
    setMyPendingRequests(
      allRequests.filter(
        (req) =>
          req.status === ORDER_REQUEST_STATUS.PENDING &&
          req.requested_by_user_id === userId
      )
    );

    // 自分が申請し、現在「納品待ち」になっているリクエストを抽出
    setMyDeliveryPendingRequests(
      allRequests.filter(
        (req) =>
          req.status === ORDER_REQUEST_STATUS.APPROVED &&
          req.requested_by_user_id === userId
      )
    );

    // 自分が申請し、却下されてまだ確認していないリクエストを抽出
    setMyRejectedRequests(
      allRequests.filter(
        (req) =>
          req.status === ORDER_REQUEST_STATUS.REJECTED &&
          req.requested_by_user_id === userId &&
          !req.rejection_acknowledged_at
      )
    );
  };

  // 画面表示時に Supabase から備品一覧・発注リクエスト一覧・ログインユーザーを取得
  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsData, requestsData, { data: authData }, appUser] =
          await Promise.all([
            getItems(),
            getOrderRequests([ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED, ORDER_REQUEST_STATUS.REJECTED]),
            getCurrentUser(),
            getCurrentAppUser(),
          ]);

        setItems(itemsData);
        setUserRole(appUser?.role ?? null);

        const userId = authData.user?.id ?? null;
        applyRequestsData(requestsData as OrderRequestWithItem[], userId);
      } catch (error) {
        console.error("データ取得エラー:", error);
      }
    }

    fetchData();
  }, []);

  // --- 納品完了の確定処理（自分がリクエストした備品を受け取った場合） ---
  const handleConfirmDelivery = async (requestId: string, itemName: string) => {
    setConfirmingRequestId(requestId);

    try {
      await confirmDelivery(requestId);
      alert(`「${itemName}」の納品を確認しました。`);

      const [itemsData, requestsData, { data: authData }] = await Promise.all([
        getItems(),
        getOrderRequests([ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED, ORDER_REQUEST_STATUS.REJECTED]),
        getCurrentUser(),
      ]);
      setItems(itemsData);
      applyRequestsData(
        requestsData as OrderRequestWithItem[],
        authData.user?.id ?? null
      );
    } catch (error) {
      console.error("納品確認エラー:", error);
      const message =
        error instanceof Error ? error.message : "納品確認処理に失敗しました。";
      alert(message);
    } finally {
      setConfirmingRequestId(null);
    }
  };

  // --- 却下通知の確認処理（申請者が却下内容を確認した場合） ---
  const handleAcknowledgeRejection = async (requestId: string) => {
    setAcknowledgingRequestId(requestId);

    try {
      await acknowledgeRejection(requestId);

      const [requestsData, { data: authData }] = await Promise.all([
        getOrderRequests([ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED, ORDER_REQUEST_STATUS.REJECTED]),
        getCurrentUser(),
      ]);
      applyRequestsData(
        requestsData as OrderRequestWithItem[],
        authData.user?.id ?? null
      );
    } catch (error) {
      console.error("却下確認エラー:", error);
      const message =
        error instanceof Error ? error.message : "確認処理に失敗しました。";
      alert(message);
    } finally {
      setAcknowledgingRequestId(null);
    }
  };

  // --- 「リクエスト中」詳細モーダルの表示対象が変わるたびに、その備品分だけ遅延取得する ---
  // モーダルを閉じた後や別の備品を開いた後に古い取得結果が反映されないよう、
  // cleanup で古いリクエストの結果を無視するフラグを立てる。
  useEffect(() => {
    const itemId = requestStatusItem?.id;

    // モーダルが閉じている（表示対象がない）間は取得不要。
    // このとき requestStatusItem && <RequestStatusModal ... /> により
    // モーダル自体が描画されないため、直前の取得結果をここで消す必要はない。
    if (!itemId) return;

    let ignore = false;

    getOrderRequests(
      [ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED],
      { includeRequester: true, itemId }
    )
      .then((requests) => {
        if (!ignore) setRequestStatusRequests(requests as OrderRequestWithItem[]);
      })
      .catch((error) => {
        console.error("リクエスト詳細の取得エラー:", error);
        if (!ignore) setRequestStatusRequests([]);
      })
      .finally(() => {
        if (!ignore) setIsLoadingRequestStatus(false);
      });

    return () => {
      ignore = true;
    };
  }, [requestStatusItem?.id]);

  const closeRequestStatusModal = () => {
    setRequestStatusItem(null);
  };

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

    // アラート（要補充・在庫切れ）のフィルタリング
    if (filterMode === "alert") {
      result = result.filter((item) => {
        const hasReq = requestedItemIds.has(item.id);
        const statusInfo: ItemStatusInfo = getItemStatus(item.current_stock, item.threshold_stock, hasReq);
        // 件数表示（displayAlertCount）と同じ定義に統一：要補充・在庫切れのみをアラート対象とする
        return statusInfo.status === "low_stock" || statusInfo.status === "out_of_stock";
      });
    }

    if (sortKey === "stock-asc") result.sort((a, b) => a.current_stock - b.current_stock);
    else if (sortKey === "stock-desc") result.sort((a, b) => b.current_stock - a.current_stock);
    else if (sortKey === "name") result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    else if (sortKey === "location") result.sort((a, b) => a.location.localeCompare(b.location, "ja"));

    return result;
  }, [items, requestedItemIds, searchQuery, filterMode, sortKey]);

  // アラート数を計算（要補充または在庫切れの件数）
  const displayAlertCount = useMemo(() => {
    return items.filter((item) => {
      const hasReq = requestedItemIds.has(item.id);
      const statusInfo: ItemStatusInfo = getItemStatus(item.current_stock, item.threshold_stock, hasReq);
      return statusInfo.status === "low_stock" || statusInfo.status === "out_of_stock";
    }).length;
  }, [items, requestedItemIds]);

  return (
    <Layout className="max-w-7xl space-y-6 my-6">
      {/* ヘッダーエリア */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wider">在庫一覧</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-0.5">STOCK MANAGEMENT</p>
        </div>
        <div className="flex gap-2">
          {userRole === "役職" && (
            <div className="w-44">
              <Button
                href="/supply/admin"
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2 border border-slate-300"
              >
                🗂️ 役職･管理者専用画面へ
              </Button>
            </div>
          )}
          <div className="w-44">
            <Button href="/supply/requests" className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm py-2 border border-slate-300">
              📝 発注リクエストを作成
            </Button>
          </div>
        </div>
      </div>

      {/* あなたが申請中の備品エリア（承認待ち） */}
      <RequestPanel
        icon="🕒"
        color="amber"
        title="あなたが申請中の備品"
        requests={myPendingRequests}
        renderDetails={(req) => (
          <>
            <div className="text-xs text-slate-500 mt-0.5">
              希望数量: {req.request_quantity} {req.items?.unit ?? "個"}
              {req.created_at && (
                <>
                  {" "}
                  ／ 申請日時: {new Date(req.created_at).toLocaleString("ja-JP")}
                </>
              )}
            </div>
            <div className="text-xs text-amber-600 font-bold mt-1">
              承認待ちです。役職者の承認をお待ちください。
            </div>
          </>
        )}
      />

      {/* 自分がリクエストした納品待ち備品エリア */}
      <RequestPanel
        icon="📦"
        color="blue"
        title="あなたが申請した納品待ちの備品"
        requests={myDeliveryPendingRequests}
        renderDetails={(req) => (
          <div className="text-xs text-slate-500 mt-0.5">
            希望数量: {req.request_quantity} {req.items?.unit ?? "個"}
            {req.approved_at && (
              <>
                {" "}
                ／ 承認日時: {new Date(req.approved_at).toLocaleString("ja-JP")}
              </>
            )}
          </div>
        )}
        renderAction={(req) => (
          <button
            type="button"
            onClick={() =>
              handleConfirmDelivery(req.id, req.items?.name ?? "不明な備品")
            }
            disabled={confirmingRequestId === req.id}
            className="bg-brand-dark hover:bg-brand-blue text-white text-xs font-bold py-2 px-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {confirmingRequestId === req.id ? "処理中..." : "✅ 納品完了"}
          </button>
        )}
      />

      {/* 却下されたリクエストエリア */}
      <RequestPanel
        icon="❌"
        color="red"
        title="却下されたリクエスト"
        requests={myRejectedRequests}
        renderDetails={(req) => (
          <>
            <div className="text-xs text-slate-500 mt-0.5">
              希望数量: {req.request_quantity} {req.items?.unit ?? "個"}
            </div>
            {req.rejected_reason && (
              <div className="text-xs text-red-600 mt-1">
                却下理由: 「{req.rejected_reason}」
              </div>
            )}
          </>
        )}
        renderAction={(req) => (
          <button
            type="button"
            onClick={() => handleAcknowledgeRejection(req.id)}
            disabled={acknowledgingRequestId === req.id}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold py-2 px-3 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {acknowledgingRequestId === req.id ? "処理中..." : "確認しました"}
          </button>
        )}
      />

      {/* 上部サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "該当備品数", count: String(processedItems.length), sub: "件表示中", color: "text-slate-800" },
          { title: "在庫アラート", count: String(displayAlertCount), sub: "件 補充必要", color: "text-red-500" },
          { title: "発注リクエスト中", count: String(requestedItemIds.size), sub: "件 処理中", color: "text-blue-600" },
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
                アラートのみ ({displayAlertCount})
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
                  const hasReq = requestedItemIds.has(item.id);
                  const statusInfo: ItemStatusInfo = getItemStatus(item.current_stock, item.threshold_stock, hasReq);
                  const isAlert = statusInfo.status === "low_stock" || statusInfo.status === "out_of_stock";

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
                        {statusInfo.status === "requested" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsLoadingRequestStatus(true);
                              setRequestStatusItem(item);
                            }}
                            className="px-2 py-0.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            {statusInfo.label}
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            statusInfo.status === "in_stock" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            statusInfo.status === "low_stock" ? "bg-orange-50 text-orange-600 border-orange-100" :
                            "bg-red-100 text-red-700 border-red-200"
                          }`}>
                            {statusInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openStockModal(item)}
                          className="bg-brand-dark hover:bg-brand-blue text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors cursor-pointer"
                        >
                          {userRole === "役職" ? "消費 / 入庫" : "消費"}
                        </button>
                        <div className="inline-block w-14">
                          <Button href={`/supply/requests?itemId=${item.id}`} className="bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-blue border border-slate-300 text-xs font-bold py-1 px-2 rounded-md">申請</Button>
                        </div>
                        {userRole === "役職" && (
                          <button type="button" onClick={() => openEditModal(item)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center cursor-pointer text-xs">✏️</button>
                        )}
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
        <Modal
          titleId="edit-item-modal-title"
          title="備品情報の編集"
          maxWidthClassName="max-w-lg"
          footer={
            <>
              <button onClick={() => { setIsEditOpen(false); setEditItem(null); }} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer">キャンセル</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-brand-dark text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer">保存する</button>
            </>
          }
        >
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
        </Modal>
      )}

      {/* 出入庫モーダル */}
      {stockItem && (
        <StockModal
          key={stockItem.id}
          item={stockItem}
          isSaving={isSaving}
          allowStockIn={userRole === "役職"}
          onClose={() => setStockItem(null)}
          onSave={handleSaveStock}
        />
      )}

      {/* リクエスト中詳細モーダル */}
      {requestStatusItem && (
        <RequestStatusModal
          itemName={requestStatusItem.name}
          requests={requestStatusRequests}
          isLoading={isLoadingRequestStatus}
          onClose={closeRequestStatusModal}
        />
      )}
    </Layout>
  );
}