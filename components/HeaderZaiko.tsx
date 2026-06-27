'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

// 1. 外から受け取るユーザー情報の型を定義
interface HeaderDashboardProps {
  user?: {
    user_no: string;
    name: string;
  } | null;
}

// 2. Propsを受け取れるように変更（データがない場合はとりあえず以前のモックを表示）
export default function HeaderDashboard({ user }: HeaderDashboardProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // ログイン情報がある場合はそれを使い、なければ初期値を出す
  const displayUserNo = user?.user_no || "U00123";
  const displayUserName = user?.name || "山田 太郎";

  return (
    <header className="w-full bg-brand-dark text-white px-6 py-2.5 flex justify-between items-center text-sm tracking-wider font-mono shadow-md">
      <div className="flex items-center space-x-4">
        <Link href="/orders" className="flex items-center space-x-3 hover:opacity-85 transition-opacity flex-shrink-0">
          <Logo className="h-9" />
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-sm tracking-widest text-slate-100">備品在庫管理システム</span>
              <span className="text-[10px] text-slate-400 font-normal">v3.2.1</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-6 text-xs flex-shrink-0">
        <div className="text-slate-300 hidden sm:block">
          {/* 3. 動的に表示が変わるように修正 */}
          ログインユーザー: <span className="text-white font-medium">{displayUserNo} / {displayUserName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded border border-slate-600 transition-all flex items-center space-x-1 cursor-pointer font-sans"
        >
          <span>[→</span>
          <span>ログアウト</span>
        </button>
      </div>
    </header>
  );
}