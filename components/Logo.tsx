'use client';

import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'h-9' }: LogoProps) {
  return (
    <svg 
      className={`${className} w-auto drop-shadow-md`} 
      viewBox="0 0 70 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 背景グラデーションの定義 */}
      <defs>
        <linearGradient id="logo-blue" x1="0" y1="0" x2="0" y2="80">
          <stop offset="0%" stopColor="#50b1e7"/>
          <stop offset="100%" stopColor="#1a7db8"/>
        </linearGradient>
        <linearGradient id="yamadai-blue" x1="0" y1="83" x2="0" y2="110">
          <stop offset="0%" stopColor="#67bbe7"/>
          <stop offset="100%" stopColor="#2c89be"/>
        </linearGradient>
        <linearGradient id="silver-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="50%" stopColor="#dcdcdc"/>
          <stop offset="100%" stopColor="#aaaaaa"/>
        </linearGradient>
      </defs>

      {/* 全体枠 */}
      <rect x="0.5" y="0.5" width="69" height="109" rx="2" fill="#2d3748" stroke="#a0aec0" strokeWidth="1"/>

      {/* 上部ブルーボックス */}
      <rect x="2" y="2" width="66" height="78" rx="1" fill="url(#logo-blue)"/>
      
      {/* 「Y」モチーフのシルバーエンブレム */}
      <path d="M 15,36 L 55,36 L 48,43 L 22,43 Z" fill="url(#silver-grad)"/>
      <path d="M 24,45 L 52,45 L 45,52 L 21,52 Z" fill="url(#silver-grad)"/>
      <path d="M 22,54 L 44,54 L 38,61 L 20,61 Z" fill="url(#silver-grad)"/>
      <path d="M 19,63 L 36,63 L 31,70 L 16,70 Z" fill="url(#silver-grad)"/>
      <path d="M 40,36 L 58,41 L 43,49 L 34,44 Z" fill="url(#silver-grad)"/>

      {/* 下部境界線 */}
      <rect x="1" y="81" width="68" height="2" fill="#718096"/>

      {/* 下部yamadaiボックス */}
      <rect x="2" y="84" width="66" height="24" rx="1" fill="url(#yamadai-blue)"/>
      
      {/* yamadai テキスト */}
      <text x="35" y="100" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="0.5">yamadai</text>
    </svg>
  );
}