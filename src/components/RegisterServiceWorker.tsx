"use client";

import { useEffect } from "react";

/** Registers the static-asset service worker in production builds only. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // The site still works when installation is unavailable.
    });
  }, []);
  return null;
}
