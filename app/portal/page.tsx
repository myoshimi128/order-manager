"use client";

import React from "react";
import { Layout } from "@/components/Layout"; // 共通レイアウト
import { Button } from "@/components/Button"; // 共通ボタン

export default function SystemPortal() {
  return (
    // 在庫一覧画面と同じ仕様（max-w-7xl w-full）をLayoutに直接渡します
    <Layout className="flex flex-col items-center justify-center max-w-7xl w-full">
      
      {/* メイン選択エリア：在庫一覧と同じ最大幅（w-full）で伸び伸びと配置 */}
      <div className="w-full py-12 px-6 space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-(--color-brand-dark) tracking-tight">
            社内システム選択
          </h1>
          <p className="text-sm text-[#64748b] mt-2">
            業務を行うシステムを選択してください。
          </p>
        </div>

        {/* 2つのシステムへの分岐カード（2カラム配置）：w-full でワイドに広げます */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* 1. 製造指示書管理システム */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] p-6 flex flex-col justify-between hover:shadow-md hover:border-(--color-brand-blue)/50 transition-all group text-left min-h-[200px]">
            <div className="space-y-3 mb-6">
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
            
            <Button href="/orders">システムを開く</Button>
          </div>

          {/* 2. 備品在庫管理システム */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e2e8f0] p-6 flex flex-col justify-between hover:shadow-md hover:border-(--color-brand-blue)/50 transition-all group text-left min-h-[200px]">
            <div className="space-y-3 mb-6">
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
            
            <Button href="/supply">システムを開く</Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}