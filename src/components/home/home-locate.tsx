"use client";

import { useEffect, useState } from "react";
import { HOME_ORIGIN_EVENT, type HomeOriginDetail } from "~/components/home/home-events";

/** Turns the SSR "find nearby" links into a geolocation request after JS loads. */
export function HomeLocate({ message }: { message: string }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[data-find-nearby]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!navigator.geolocation) return;
      event.preventDefault();
      setNote("");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const detail: HomeOriginDetail = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          window.dispatchEvent(
            new CustomEvent(HOME_ORIGIN_EVENT, { detail }),
          );
        },
        () => {
          setNote(message);
          window.setTimeout(() => {
            window.location.assign(link.href);
          }, 900);
        },
        { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
      );
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [message]);

  if (!note) return null;
  return (
    <p className="home-geo-note" role="status">
      {note}
    </p>
  );
}
