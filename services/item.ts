import { supabase } from "@/lib/supabase";
import { createStockLog } from "@/services/stockLogs";

// 備品登録時に受け取るデータの型
export type CreateItemInput = {
  name: string;
  catalog_no?: string;
  purchase_url?: string;
  location: string;
  current_stock?: number;
  threshold_stock?: number;
  unit?: string;
};

// 備品更新時に受け取るデータの型
export type UpdateItemInput = {
  id: string;
  name: string;
  catalog_no?: string | null;
  unit: string;
  location: string;
};

// 出入庫移動時の入力型
export type RecordStockMovementInput = {
  itemId: string;
  logType: "消費" | "直接入庫";
  quantityChanged: number;
  newStock: number;
  userId: string;
};

// 備品を新規登録する処理
export async function createItem(item: CreateItemInput) {
  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        name: item.name,
        catalog_no: item.catalog_no ?? null,
        purchase_url: item.purchase_url ?? null,
        location: item.location,
        current_stock: item.current_stock ?? 0,
        threshold_stock: item.threshold_stock ?? 1,
        unit: item.unit ?? "個",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 備品一覧を取得する処理
export async function getItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// 備品情報を更新する処理 (編集モーダル用)
export async function updateItemDetails({
  id,
  name,
  catalog_no,
  unit,
  location,
}: UpdateItemInput) {
  const { data, error } = await supabase
    .from("items")
    .update({
      name,
      catalog_no: catalog_no ?? null,
      unit,
      location,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 在庫数の更新 ＋ 履歴ログ追加（オーケストレーション処理）
export async function recordStockMovement({
  itemId,
  logType,
  quantityChanged,
  newStock,
  userId,
}: RecordStockMovementInput) {
  // 1. 在庫数を更新 (itemsテーブル)
  const { error: itemError } = await supabase
    .from("items")
    .update({ current_stock: newStock })
    .eq("id", itemId);

  if (itemError) {
    console.error("在庫数の更新に失敗しました:", itemError);
    throw itemError;
  }

  // 2. ログを追加 (stockLogs.ts の関数を実行)
  await createStockLog({
    itemId,
    logType,
    quantityChanged,
    userId,
  });

  return true;
}