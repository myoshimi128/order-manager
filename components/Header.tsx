'use client';

import React, { useEffect, useState } from 'react';

import Logo from '@/components/Logo';
import { getCurrentAppUser, logout } from '@/services/auth';
import { type User } from '@/services/users';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      // getCurrentAppUser を使って Auth + users テーブル情報を取得
      const userData = await getCurrentAppUser();
      if (userData) {
        setUser(userData);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    // 1. クッキー (auth-token) をクリア
    document.cookie = "auth-token=; path=/; max-age=0;";

    // 2. Supabase のセッション破棄 ＆ LocalStorage クリア
    await logout();

    // 3. 状態やキャッシュを完全初期化するためにフルリロードでログインへ遷移
    window.location.href = '/login';
  }

  return (
    <header className="w-full bg-brand-dark text-white px-6 py-2.5 flex justify-between items-center text-sm tracking-wider font-mono shadow-md">
      {/* 左側 */}
      <div className="flex items-center space-x-3">
        <Logo className="h-8" />

        <div className="flex flex-col text-left leading-none">
          <span className="font-bold text-xs tracking-wider">
            社内システム
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            V3.2.1
          </span>
        </div>
      </div>

      {/* 右側 */}
      <div className="flex items-center gap-6">
        {/* ユーザー情報 */}
        <div className="text-right text-xs leading-tight">
          <p className="text-slate-400">
            No.{user?.user_no ?? '-'}
          </p>

          <p className="font-bold">
            {user?.name ?? '読み込み中...'}
          </p>
        </div>

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 border border-slate-500 rounded hover:bg-slate-700 transition-colors cursor-pointer"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}