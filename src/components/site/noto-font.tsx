"use client";

import { useEffect } from "react";
import { notoFontClassName } from "~/app/fonts";

/**
 * Noto Sans JP is dozens of subset files. Applying it during the first
 * second crowds out a tab change on a slow link, so the face waits until
 * the shell has had a chance to prefetch.
 */
export function NotoFont() {
  useEffect(() => {
    const add = () => {
      document.documentElement.classList.add(notoFontClassName);
      document.documentElement.dataset.noto = "1";
    };
    if (document.documentElement.dataset.noto === "1") return;
    const id = window.setTimeout(add, 8000);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
