import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. ログイン画面自体へのアクセスは絶対にそのまま通す
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // 2. 本番を想定した認証チェック（Cookieからトークンを取得）
  // 本番ではここに 'sb-access-token' などのクッキー名が入ります
  const token = request.cookies.get("auth-token")?.value;
  const isLoggedIn = !!token; // トークンが存在すれば true

  // 3. 未ログイン状態で保護された画面にアクセスしたらログイン画面へ
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. ログイン済みならそのまま画面を表示
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 次のパス以外の、すべての画面遷移（/portal や /supply など今後増える画面すべて）で
     * セキュリティチェック（ミドルウェア）を実行する：
     * - _next/static (Next.jsのシステムビルドファイル)
     * - _next/image (画像最適化機能)
     * - favicon.ico (ブラウザのタブに表示されるアイコン)
     * - publicフォルダ内の画像など (末尾が .svg や .png などの静的ファイル)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};