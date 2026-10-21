"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { setHomeMapActive } from "~/components/home/home-events";
import { HomeMapLoader } from "~/components/home/home-map-loader";
import type { HomeLocale } from "~/lib/home-locale";
import { splitLocalePath } from "~/lib/pilgrimage-locale";

/** Keeps one MapLibre instance mounted and aligned to the homepage slot. */
export function PersistentHomeMap({ locale }: { locale: HomeLocale }) {
  const pathname = usePathname() || "/";
  const onHome = splitLocalePath(pathname).pathname === "/";
  const [seenHome, setSeenHome] = useState(onHome);
  const holderRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (onHome) setSeenHome(true);
  }, [onHome]);

  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let tilesOn: boolean | null = null;
    const place = () => {
      const slot = document.getElementById("home-map-slot");
      const rect = slot?.getBoundingClientRect();
      const active = Boolean(
        onHome && slot && rect && rect.width >= 2 && rect.height >= 2,
      );
      if (active !== tilesOn) {
        tilesOn = active;
        window.setTimeout(() => setHomeMapActive(active), 0);
      }
      if (!active || !rect) {
        holder.dataset.parked = "true";
        return;
      }
      holder.dataset.parked = "false";
      const left = `${rect.left}px`;
      const top = `${rect.top}px`;
      const width = `${rect.width}px`;
      const height = `${rect.height}px`;
      if (holder.style.left !== left) holder.style.left = left;
      if (holder.style.top !== top) holder.style.top = top;
      if (holder.style.width !== width) holder.style.width = width;
      if (holder.style.height !== height) holder.style.height = height;
    };
    place();
    const slot = document.getElementById("home-map-slot");
    const observer = new ResizeObserver(place);
    if (slot) observer.observe(slot);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [onHome, pathname, seenHome]);

  if (!seenHome) return null;

  return (
    <div
      ref={holderRef}
      className="home-map-persist"
      data-parked={onHome ? "false" : "true"}
    >
      <HomeMapLoader locale={locale} />
    </div>
  );
}
