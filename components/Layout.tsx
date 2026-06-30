import React from 'react';
import Header from "./Header";
import Footer from "./Footer";

// レイアウトに渡せる設定（Props）の型定義
type LayoutProps = {
  children: React.ReactNode; // ページごとのメインコンテンツ
  className?: string;        // ページごとに横幅や配置を変えるためのクラス
};

// デフォルトはログイン画面用に中央配置（flex flex-col items-center justify-center max-w-md）にしておきます
export const Layout = ({ children, className = "flex flex-col items-center justify-center max-w-md w-full" }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 共通ヘッダー */}
      <Header />
      
      {/* メインコンテンツ（全体に方眼紙の背景を適用） */}
      <main 
        className="flex-1 px-4 py-12 relative flex justify-center"
        style={{
          backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* 外から渡された className（幅や配置設定）をここに適用して、方眼紙の中でコンテンツを広げる */}
        <div className={`w-full ${className}`}>
          {children}
        </div>
      </main> 
      
      {/* 共通フッター */}
      <Footer />
    </div>
  );
};