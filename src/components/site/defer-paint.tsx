"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { isSoftNav } from "~/components/site/soft-nav";

function initialCount(total: number): number {
  return isSoftNav() ? 0 : total;
}

/**
 * Document loads paint every child. A later client navigation paints a
 * first screen, then the rest across frames, so one list cannot block
 * the next tab.
 */
export function DeferPaint({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const [count, setCount] = useState(() => initialCount(items.length));
  useEffect(() => {
    if (count >= items.length) return;
    let current = count;
    let timer = 0;
    const step = () => {
      current = Math.min(items.length, current + 24);
      setCount(current);
      if (current < items.length) timer = window.setTimeout(step, 16);
    };
    timer = window.setTimeout(step, 16);
    return () => window.clearTimeout(timer);
  }, [count, items.length]);
  return items.slice(0, count);
}
