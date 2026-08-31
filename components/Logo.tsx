'use client';

import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'h-9' }: LogoProps) {
  return (
    // 公開用のサンプルロゴ。実運用時は自社ロゴに差し替える。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-sample.svg"
      alt="SAMPLE CORPORATION"
      className={`${className} w-auto drop-shadow-md object-contain`}
    />
  );
}
