// src/components/Button.tsx
import React from "react";
import Link from "next/link";

// ボタンに渡せる設定（Props）の型定義
type ButtonProps = {
  children: React.ReactNode;            // ボタンの文字
  href?: string;                        // リンク先のURL（任意）
  onClick?: () => void;                 // クリック時の処理（任意）
  type?: "button" | "submit" | "reset"; // ボタンの属性（任意。初期値: button）
  className?: string;                   // 追加のスタイル（任意）
  disabled?: boolean;                   // ボタンを無効化するか（任意）
  loading?: boolean;                    // ローディング中か（任意）
};

export const Button = ({
  children,
  href,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  loading = false,
}: ButtonProps) => {

  // 全ボタン共通のベーススタイル
  const baseStyle =
    "w-full py-2.5 font-semibold text-sm rounded-lg text-center flex justify-center items-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  // 外から背景色（bg-***）が指定されているかチェック
  const hasBg = className.includes("bg-");

  // 背景色の指定があれば使い、無ければデフォルトのグレー背景にする
  const finalStyle = hasBg
    ? `${baseStyle} ${className}`
    : `bg-slate-100 hover:bg-(--color-brand-dark) text-(--color-brand-blue) hover:text-white ${baseStyle} ${className}`;

  // 【ページ移動】hrefがある場合は、Next.jsのリンクとして出力
  if (href) {
    return (
      <Link href={href} className={finalStyle}>
        {children}
      </Link>
    );
  }

  // 【通常のボタン】hrefがない場合は、通常のbuttonタグとして出力
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading} // ローディング中も自動でクリック不可にする
      className={finalStyle}
    >
      {children}
    </button>
  );
};