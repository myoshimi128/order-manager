import { supabase } from "@/lib/supabase";
import { createStockLog } from "@/services/stockLogs";

// --- ステータス判定用の型定義と判定関数 ---
export type ItemStatus = "out_of_stock" | "requested" | "low_stock" | "in_stock";

export interface ItemStatusInfo {
  status: ItemStatus;
  label: string;
  color: string;
}

/**
 * 在庫数(current_stock)、しきい値(threshold_stock)、未完了リクエストの有無からステータスを算出
 */
export function getItemStatus(
  currentStock: number,
  thresholdStock: number,
  hasActiveRequest: boolean = false
): ItemStatusInfo {
  // 1. 在庫切れ
  if (currentStock <= 0) {
    return {
      status: "out_of_stock",
      label: "在庫切れ",
      color: "red",
    };
  }

  // 2. 基準数以下の場合の分岐
  if (currentStock <= thresholdStock) {
    if (hasActiveRequest) {
      return {
        status: "requested",
        label: "リクエスト中",
        color: "blue",
      };
    }
    return {
      status: "low_stock",
      label: "要補充",
      color: "yellow",
    };
  }

  // 3. 在庫十分
  return {
    status: "in_stock",
    label: "在庫あり",
    color: "green",
  };
}

export type Item = {
  id: string;
  name: string;
  catalog_no?: string | null;
  purchase_url?: string | null;
  location: string;
  current_stock: number;
  threshold_stock: number;
  unit: string;
  created_at?: string;
};

export type CreateItemInput = {
  name: string;
  catalog_no?: string;
  purchase_url?: string;
  location: string;
  current_stock?: number;
  threshold_stock?: number;
  unit?: string;
};

export type UpdateItemInput = {
  id: string;
  name: string;
  catalog_no?: string | null;
  unit: string;
  location: string;
};

export type RecordStockMovementInput = {
  itemId: string;
  logType: "消費" | "直接入庫";
  quantityChanged: number;
  newStock: number;
  userId: string;
};

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

export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

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

export async function recordStockMovement({
  itemId,
  logType,
  quantityChanged,
  newStock,
  userId,
}: RecordStockMovementInput) {
  const { error: itemError } = await supabase
    .from("items")
    .update({ current_stock: newStock })
    .eq("id", itemId);

  if (itemError) {
    console.error("在庫数の更新に失敗しました:", itemError);
    throw itemError;
  }

  await createStockLog({
    itemId,
    logType,
    quantityChanged,
    userId,
  });

  return true;
}