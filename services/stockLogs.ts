import { supabase } from "@/lib/supabase";

export type CreateStockLogInput = {
  itemId: string;
  logType: "消費" | "直接入庫";
  quantityChanged: number;
  userId: string;
};

// 出入庫ログを 1 件追加する処理
export async function createStockLog({
  itemId,
  logType,
  quantityChanged,
  userId,
}: CreateStockLogInput) {
  const { data, error } = await supabase.from("stock_logs").insert([
    {
      item_id: itemId,
      log_type: logType,
      quantity_changed: quantityChanged,
      logged_by_user_id: userId,
    },
  ]);

  if (error) {
    console.error("出入庫ログの記録に失敗しました:", error);
    throw error;
  }

  return data;
}