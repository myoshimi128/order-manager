import { supabase } from "@/lib/supabase";

// order_requests.status の正規語彙（画面側はこの定数を参照すること）
export const ORDER_REQUEST_STATUS = {
  PENDING: "承認待ち",
  APPROVED: "納品待ち",
  DELIVERED: "納品済み",
  REJECTED: "却下",
} as const;

export type OrderRequestStatus =
  (typeof ORDER_REQUEST_STATUS)[keyof typeof ORDER_REQUEST_STATUS];

export type CreateOrderRequestInput = {
  itemId: string;
  requestQuantity: number;
  userId?: string;
  comment?: string;
};

export type OrderRequestWithItem = {
  id: string;
  item_id: string;
  request_quantity: number;
  status: string; // '承認待ち', '納品待ち', '納品済み', '却下'
  comment?: string | null;
  requested_by_user_id?: string;
  created_at?: string;
  approved_at?: string | null;  // 旧 ordered_at から変更
  rejected_at?: string | null;  // 追加
  rejected_reason?: string | null;
  delivered_at?: string | null;
  delivered_by?: string | null; // 追加
  items?: {
    id: string;
    name: string;
    catalog_no?: string | null;
    unit: string;
    location: string;
    purchase_url?: string | null;
  } | null;
};

// SupabaseへのINSERT用型定義（any回避）
type OrderRequestPayload = {
  item_id: string;
  request_quantity: number;
  status: string;
  comment: string | null;
  requested_by_user_id?: string;
};

// 🛠️ ステータス更新用の型定義を追加（any回避）
type OrderRequestUpdatePayload = {
  status: typeof ORDER_REQUEST_STATUS.APPROVED | typeof ORDER_REQUEST_STATUS.REJECTED;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
};

/**
 * 1. 発注リクエストを作成する処理 (一般ユーザー用)
 * - 初期ステータスを「承認待ち」に設定
 * - コメントが空の場合も安全に送信可能
 * - userIdが渡されない場合は現在のログインセッションから自動補完
 */
export async function createOrderRequest({
  itemId,
  requestQuantity,
  userId,
  comment,
}: CreateOrderRequestInput) {
  try {
    // userIdが明示されていない場合はログインユーザーのIDを取得
    let activeUserId = userId;
    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id;
    }

    // 型を明示してペイロードを作成
    const payload: OrderRequestPayload = {
      item_id: itemId,
      request_quantity: Number(requestQuantity),
      status: ORDER_REQUEST_STATUS.PENDING,
      comment: comment && comment.trim() !== "" ? comment.trim() : null,
    };

    if (activeUserId) {
      payload.requested_by_user_id = activeUserId;
    }

    const { data, error } = await supabase
      .from("order_requests")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("発注リクエストの作成に失敗しました (Supabase Error):", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("createOrderRequest エラーの詳細:", error);
    throw error;
  }
}

/**
 * 2. リクエスト一覧を取得する処理 (管理者用・一般履歴用 共通)
 * - itemsテーブルとのリレーション設定がなくてもエラーにならない安全な2段階取得
 */
export async function getOrderRequests() {
  try {
    // 1) order_requests テーブルの全データを取得
    const { data: requests, error: reqError } = await supabase
      .from("order_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (reqError) {
      console.error("リクエスト一覧の取得に失敗しました:", reqError);
      throw reqError;
    }

    if (!requests || requests.length === 0) {
      return [];
    }

    // 2) 関連する item_id を抽出して items テーブルを一括取得
    const itemIds = Array.from(new Set(requests.map((r) => r.item_id).filter(Boolean)));

    if (itemIds.length === 0) {
      return requests.map((req) => ({ ...req, items: null }));
    }

    const { data: items, error: itemError } = await supabase
      .from("items")
      .select("id, name, catalog_no, unit, location, purchase_url")
      .in("id", itemIds);

    if (itemError) {
      console.warn("備品情報の取得に失敗しました（リクエストデータのみ返却します）:", itemError);
    }

    // 3) Map を使って高速マッピング・データ結合
    const itemsMap = new Map((items || []).map((item) => [item.id, item]));

    return requests.map((req) => ({
      ...req,
      items: itemsMap.get(req.item_id) || null,
    })) as OrderRequestWithItem[];
  } catch (error) {
    console.error("getOrderRequests エラー:", error);
    throw error;
  }
}

/**
 * 3. ステータスを「承認（納品待ち）」または「却下」に更新する処理 (管理者用)
 * - 却下の場合は理由（rejectedReason）をオプショナルで受け取る
 */
export async function updateOrderRequestStatus(
  id: string,
  status: typeof ORDER_REQUEST_STATUS.APPROVED | typeof ORDER_REQUEST_STATUS.REJECTED,
  rejectedReason?: string
) {
  const now = new Date().toISOString();

  // 🛠️ anyを排除し、型安全なオブジェクトとして定義
  const updateData: OrderRequestUpdatePayload = { status };

  if (status === ORDER_REQUEST_STATUS.APPROVED) {
    updateData.approved_at = now;
  } else if (status === ORDER_REQUEST_STATUS.REJECTED) {
    updateData.rejected_at = now;
    updateData.rejected_reason = rejectedReason || null;
  }

  const { data, error } = await supabase
    .from("order_requests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("ステータス更新に失敗しました:", error);
    throw error;
  }

  return data;
}

/**
 * 4. リクエストを削除する処理 (管理者用)
 */
export async function deleteOrderRequest(id: string) {
  const { error } = await supabase
    .from("order_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("リクエストの削除に失敗しました:", error);
    throw error;
  }

  return true;
}

/**
 * 5. 納品確認処理 (一般ユーザー・管理者共通)
 */
export async function confirmDelivery(orderRequestId: string, userId?: string) {
  try {
    let activeUserId = userId;
    if (!activeUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id;
    }

    if (!activeUserId) {
      return { success: false, error: "ユーザーセッションが見つかりません。" };
    }

    const { error } = await supabase.rpc("confirm_delivery_v1", {
      p_order_request_id: orderRequestId,
      p_user_id: activeUserId,
    });

    if (error) {
      console.error("納品確認RPCエラー:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) { // 🛠️ catch (error: any) から any を排除して安全にハンドリング
    console.error("confirmDelivery 処理エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "予期せぬエラーが発生しました。";
    return { success: false, error: errorMessage };
  }
}