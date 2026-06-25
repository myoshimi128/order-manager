import React from 'react';

export default function Footer() {
  return (
    // こちらも bg-brand-dark に変更
    <footer className="w-full bg-brand-dark text-gray-300 px-6 py-3 flex flex-col sm:flex-row justify-between items-center text-xs tracking-wider font-mono border-t border-slate-700">
      <div>
        &copy; 2026 MANUFACTURING SYSTEMS DEPT.
      </div>
      <div className="mt-2 sm:mt-0 space-x-4">
        <span>お問い合わせ: 内線 4821</span>
        <span className="text-slate-500">|</span>
        <span>IT管理部</span>
      </div>
    </footer>
  );
}