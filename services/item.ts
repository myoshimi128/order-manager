import { supabase } from "@/lib/supabase";

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

// 備品を新規登録する処理
export async function createItem(item: CreateItemInput) {
  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        // フォームで入力されたデータをitemsテーブルへ登録
        name: item.name,
        catalog_no: item.catalog_no ?? null,
        purchase_url: item.purchase_url ?? null,
        location: item.location,
        current_stock: item.current_stock ?? 0,
        threshold_stock: item.threshold_stock ?? 1,
        unit: item.unit ?? "個",
      },
    ])
    // 登録したデータを取得
    .select()
    // 配列ではなく1件のデータとして受け取る
    .single();

  // エラーがあれば呼び出し元へ返す
  if (error) {
    throw error;
  }

  // 登録した備品データを返す
  return data;
}

// 備品一覧を取得する処理
export async function getItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  // エラーがあれば呼び出し元へ返す
  if (error) {
    throw error;
  }

  // 取得した備品一覧を返す
  return data;
}