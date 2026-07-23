'use client';

import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'h-9' }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/YamadaiLogo.jpg"
      alt="やまだい"
      className={`${className} w-auto drop-shadow-md object-contain`}
    />
  );
}
