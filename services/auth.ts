import { supabase } from "@/lib/supabase";
import { getUserById, type User } from "@/services/users";

// roleから遷移先を決める関数
export function getRedirectPath(role: User["role"]) {
  switch (role) {
    case "役職":
      return "/supply/admin";

    case "現場":
    case "一般":
    default:
      return "/supply";
  }
}

// ログイン処理
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error };
  }

  const authUser = data.user;

  if (!authUser) {
    return {
      error: {
        message: "ユーザー情報を取得できませんでした。",
      },
    };
  }

  try {
    const user = await getUserById(authUser.id);

    return {
      user,
      redirectTo: getRedirectPath(user.role),
      error: null,
    };
  } catch (err: unknown) {
    return {
      error: {
        message:
          err instanceof Error
            ? err.message
            : "ユーザー情報の取得に失敗しました。",
      },
    };
  }
}

// ログアウト処理（追加）
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("ログアウトエラー:", error);
    return { error };
  }
  // ブラウザ側のキャッシュ・ストレージも確実に削除
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }
  return { error: null };
}

// 現在のログインユーザーとロール情報をまとめて取得（追加）
export async function getCurrentAppUser() {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  try {
    const user = await getUserById(authUser.id);
    return user;
  } catch (err) {
    console.error("ユーザー詳細取得エラー:", err);
    return null;
  }
}

export async function getCurrentUser() {
  return await supabase.auth.getUser();
}