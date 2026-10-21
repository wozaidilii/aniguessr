"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { HomeMapLoader } from "~/components/home/home-map-loader";
import type { HomeLocale } from "~/lib/home-locale";
import { splitLocalePath } from "~/lib/pilgrimage-locale";

/**
 * The MapLibre instance lives outside the keyed page content.
 * On the homepage it is portaled into #home-map-slot; elsewhere the same
 * node is parked so zoom and center survive tab changes.
 */
export function PersistentHomeMap({ locale }: { locale: HomeLocale }) {
  const pathname = usePathname() || "/";
  const onHome = splitLocalePath(pathname).pathname === "/";
  const [seenHome, setSeenHome] = useState(onHome);
  const [park, setPark] = useState<HTMLDivElement | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (onHome) setSeenHome(true);
    setSlot(onHome ? document.getElementById("home-map-slot") : null);
  }, [onHome, pathname]);

  if (!seenHome) return null;

  const target = onHome && slot?.isConnected ? slot : park;

  return (
    <>
      <div
        ref={setPark}
        className="home-map-persist"
        data-parked="true"
        aria-hidden="true"
      />
      {target ? createPortal(<HomeMapLoader locale={locale} />, target) : null}
    </>
  );
}
