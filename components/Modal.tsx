"use client";

import React from "react";

type ModalProps = {
  titleId: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  maxWidthClassName?: string; // 例: "max-w-md"（既定）, "max-w-lg"
  spacingClassName?: string; // 例: "space-y-4"（既定）, "space-y-5"
  children: React.ReactNode;
  footer: React.ReactNode;
};

// 全モーダル共通の背景・ダイアログ枠・見出し・フッターのレイアウトをまとめたラッパー。
// 個々のモーダルは中身（フォーム等）とフッターのボタンだけを渡す。
export function Modal({
  titleId,
  title,
  subtitle,
  maxWidthClassName = "max-w-md",
  spacingClassName = "space-y-4",
  children,
  footer,
}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-2xl shadow-xl border border-slate-200 ${maxWidthClassName} w-full p-6 ${spacingClassName}`}
      >
        <div>
          <h3 id={titleId} className="text-base font-bold text-slate-800">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>

        {children}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {footer}
        </div>
      </div>
    </div>
  );
}
