import { supabase } from "@/lib/supabase";

export type CreateOrderRequestInput = {
  itemId: string;
  requestQuantity: number;
  userId?: string;
  comment?: string;
};

// SupabaseへのINSERT用型定義（any回避）
type OrderRequestPayload = {
  item_id: string;
  request_quantity: number;
  status: string;
  comment: string | null;
  requested_by_user_id?: string;
};

/**
 * 1. 発注リクエストを作成する処理 (一般ユーザー用)
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

    // 型を明示してペロードを作成
    const payload: OrderRequestPayload = {
      item_id: itemId,
      request_quantity: Number(requestQuantity),
      status: "リクエスト中",
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
 * 2. リクエスト一覧を取得する処理 (管理者用)
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
    }));
  } catch (error) {
    console.error("getOrderRequests エラー:", error);
    throw error;
  }
}

/**
 * 3. ステータスを「発注済み」に更新する処理 (管理者用)
 */
export async function updateOrderRequestStatus(id: string, status: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("order_requests")
    .update({
      status: status,
      ordered_at: status === "発注済み" ? now : null,
    })
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