"use client";

import { useId } from "react";

/** Sunrise mark from the Ayiora brand. Arc uses the logo gradient; sun and horizon use currentColor. */
export function AyioraMark({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const raw = useId().replace(/:/g, "");
  const gradientId = `ayiora-sunrise-${raw}`;
  const width = Math.round(size * (512 / 352));

  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox="0 0 512 352"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EC4F63" />
          <stop offset="55%" stopColor="#F1804F" />
          <stop offset="100%" stopColor="#F6A64C" />
        </linearGradient>
      </defs>
      <path
        d="M56 312 A200 200 0 0 1 456 312"
        stroke={`url(#${gradientId})`}
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path d="M188 312 A68 68 0 0 1 324 312 Z" fill="currentColor" />
      <path
        d="M24 312 H488"
        stroke="currentColor"
        strokeWidth="30"
        strokeLinecap="round"
      />
    </svg>
  );
}
