import { supabase } from "@/lib/supabase";
import { getUserById } from "@/services/users";

// roleから遷移先を決める関数
function getRedirectPath(role: string) {
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

  const user = await getUserById(authUser.id);

  return {
    user,
    redirectTo: getRedirectPath(user.role),
    error: null,
  };
}

export async function getCurrentUser() {
  return await supabase.auth.getUser();
}