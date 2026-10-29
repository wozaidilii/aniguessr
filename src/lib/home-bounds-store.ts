import type { HomeBoundsDetail } from "~/components/home/home-events";
import { HOME_BOUNDS_EVENT } from "~/components/home/home-events";

let latestHomeBounds: HomeBoundsDetail | null = null;

export function readLatestHomeBoundsDetail(): HomeBoundsDetail | null {
  return latestHomeBounds;
}

/** Publish bounds for nearby UI and retain the latest for late subscribers. */
export function publishHomeBoundsDetail(detail: HomeBoundsDetail): void {
  latestHomeBounds = detail;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_BOUNDS_EVENT, { detail }));
}

export function resetLatestHomeBoundsDetailForTests(): void {
  latestHomeBounds = null;
}
