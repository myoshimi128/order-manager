import { supabase } from "@/lib/supabase";

export type User = {
  id: string;
  user_no: string;
  name: string;
  role: "現場" | "一般" | "役職";
  created_at: string;
};

export async function getUserById(id: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data as User;
}