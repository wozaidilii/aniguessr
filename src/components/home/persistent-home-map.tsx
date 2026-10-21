"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
    const place = () => {
      const slot = document.getElementById("home-map-slot");
      if (!onHome || !slot) {
        holder.dataset.parked = "true";
        return;
      }
      const rect = slot.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        holder.dataset.parked = "true";
        return;
      }
      holder.dataset.parked = "false";
      holder.style.left = `${rect.left}px`;
      holder.style.top = `${rect.top}px`;
      holder.style.width = `${rect.width}px`;
      holder.style.height = `${rect.height}px`;
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
