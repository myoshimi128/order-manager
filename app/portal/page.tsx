"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SystemPortal() {
  return (
    // globals.cssの変数(var(--color-background))を背景に適用
    <div className="min-h-screen bg-(--color-background) text-(--color-foreground) flex flex-col justify-between font-sans">
      
      {/* 共通ヘッダーコンポーネント */}
      <Header />

      {/* メイン選択エリア */}
      <div className="w-full max-w-4xl mx-auto my-auto py-12 px-6 space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-(--color-brand-dark) tracking-tight">
            社内システム選択
          </h1>
          <p className="text-sm text-[#64748b] mt-2">
            業務を行うシステムを選択してください。
          </p>
        </div>

        {/* 2つのシステムへの分岐カード（2カラム配置） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          
          {/* 1. 製造指示書管理システム */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] p-6 flex flex-col justify-between hover:shadow-md hover:border-(--color-brand-blue)/50 transition-all group">
            <div className="space-y-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] text-(--color-brand-blue) flex items-center justify-center font-bold text-lg group-hover:bg-(--color-brand-blue) group-hover:text-white transition-colors">
                📋
              </div>
              <h2 className="text-lg font-bold text-(--color-brand-dark)">
                製造指示書管理システム
              </h2>
              <p className="text-xs text-[#64748b] leading-relaxed">
                製造現場への指示書の作成・発行、およびステータスの進捗管理を行います。
              </p>
            </div>
            
            {/* 初期：グレー＋青文字 / ホバー：濃いネイビー＋白文字 */}
            <Link 
              href="/orders" 
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-(--color-brand-dark) text-(--color-brand-blue) hover:text-white font-semibold text-sm rounded-lg text-center block transition-all cursor-pointer"
            >
              システムを開く
            </Link>
          </div>

          {/* 2. 備品在庫管理システム */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] p-6 flex flex-col justify-between hover:shadow-md hover:border-(--color-brand-blue)/50 transition-all group">
            <div className="space-y-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] text-(--color-brand-blue) flex items-center justify-center font-bold text-lg group-hover:bg-(--color-brand-blue) group-hover:text-white transition-colors">
                📦
              </div>
              <h2 className="text-lg font-bold text-(--color-brand-dark)">
                備品在庫・発注管理システム
              </h2>
              <p className="text-xs text-[#64748b] leading-relaxed">
                事務所・現場の備品在庫の確認、消費ログ記録、および不足時の発注リクエストを行います。
              </p>
            </div>
            
            {/* 初期：グレー＋青文字 / ホバー：濃いネイビー＋白文字 */}
            <Link 
              href="/supply" 
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-(--color-brand-dark) text-(--color-brand-blue) hover:text-white font-semibold text-sm rounded-lg text-center block transition-all cursor-pointer"
            >
              システムを開く
            </Link>
          </div>

        </div>
      </div>

      {/* 共通フッターコンポーネント */}
      <Footer />

    </div>
  );
}