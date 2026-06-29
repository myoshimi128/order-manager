'use client';

import React from 'react';
import Logo from '@/components/Logo'; // ロゴをインポート

export default function Header() {
  return (
    <header className="w-full bg-brand-dark text-white px-6 py-2.5 flex justify-between items-center text-sm tracking-wider font-mono shadow-md">
      <div className="flex items-center space-x-3">
        {/* ログイン前は少し小さめ（h-8）にしてスッキリ配置 */}
        <Logo className="h-8" />
        
        <div className="flex flex-col text-left leading-none">
          <span className="font-bold text-xs tracking-wider">社内システム</span>
          <span className="text-[9px] text-slate-400 mt-0.5">V3.2.1</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
        <span className="text-gray-300 tracking-widest">SYSTEM ONLINE</span>
      </div>
    </header>
  );
}