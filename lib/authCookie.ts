/**
 * 認証トークンをCookieに保持するためのユーティリティ。
 *
 * supabase-js はセッションを localStorage に保存するため、そのままでは
 * サーバー側（proxy.ts）からログイン状態を判定できない。
 * そこでアクセストークン（JWT）自体をCookieへ複製し、
 * サーバー側で Supabase に問い合わせて正当性を検証する。
 *
 * 注意: Cookie はクライアントJSから発行しているため httpOnly にはできない。
 * 値の偽造はサーバー側の署名検証で弾かれるが、XSS対策としては不十分であり、
 * 本番運用では @supabase/ssr を用いたサーバー側でのセッション管理へ移行する。
 */
export const AUTH_COOKIE_NAME = "sb-access-token";

export function setAuthCookie(accessToken: string, expiresInSec: number) {
  if (typeof document === "undefined") return;

  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie =
    `${AUTH_COOKIE_NAME}=${accessToken}; path=/; max-age=${expiresInSec}; samesite=lax${secure}`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
