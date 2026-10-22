import type { HomeOriginDetail } from "~/components/home/home-events";
import type { HomeOriginPoint } from "~/lib/home-origin";

/** Zoom used when Find spots and My location fly to the user. */
export const HOME_USER_FLY_ZOOM = 13;

export type HomeStartupCamera =
  | { kind: "user"; lat: number; lng: number; zoom: typeof HOME_USER_FLY_ZOOM }
  | { kind: "kanto" }
  | { kind: "focus" };

/**
 * Camera when the homepage map finishes loading.
 * A stored user location replaces the Kanto overview.
 * A focused work keeps its own frame and is not a Kanto fit.
 */
export function homeStartupCamera(
  hasFocusedWork: boolean,
  origin: HomeOriginPoint | null,
): HomeStartupCamera {
  if (hasFocusedWork) return { kind: "focus" };
  if (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
    return {
      kind: "user",
      lat: origin.lat,
      lng: origin.lng,
      zoom: HOME_USER_FLY_ZOOM,
    };
  }
  return { kind: "kanto" };
}

/** Shared locate payload. Omits keepZoom so the camera flies to HOME_USER_FLY_ZOOM. */
export function homeUserLocateDetail(
  lat: number,
  lng: number,
): HomeOriginDetail {
  return { lat, lng };
}
