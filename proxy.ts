import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

// 検証専用のクライアント。セッションを保持しないためリクエスト間で状態を持たない。
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ログイン画面自体へのアクセスはそのまま通す
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Cookieの有無だけでは判定しない。
  // 値が正当なアクセストークンかどうかを Supabase 側で検証する。
  const isLoggedIn = token
    ? !(await supabase.auth.getUser(token)).error
    : false;

  if (!isLoggedIn) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // 期限切れ・不正なトークンは残さない
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 次のパス以外の、すべての画面遷移（/supply など今後増える画面すべて）で
     * 認証チェックを実行する：
     * - _next/static (Next.jsのシステムビルドファイル)
     * - _next/image (画像最適化機能)
     * - favicon.ico (ブラウザのタブに表示されるアイコン)
     * - publicフォルダ内の画像など (末尾が .svg や .png などの静的ファイル)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
