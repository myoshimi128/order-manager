'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { setAuthCookie, clearAuthCookie } from '@/lib/authCookie';

/**
 * Supabase のセッション状態と認証Cookieを同期させる。
 * アクセストークンは有効期限が短く自動更新されるため、
 * 更新のたびにCookieを貼り直さないとサーバー側の判定だけが先に失効してしまう。
 */
export default function SessionSync() {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAuthCookie(session.access_token, session.expires_in ?? 3600);
      } else {
        clearAuthCookie();
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
