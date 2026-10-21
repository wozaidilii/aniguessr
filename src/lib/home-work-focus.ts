import type { HomeOriginPoint } from "~/lib/home-origin";
import { haversineKm } from "~/lib/pilgrimage-nav";

export const WORK_FOCUS_ORIGIN_RADIUS_KM = 30;

export interface WorkFocusPoint {
  lat: number;
  lng: number;
}

/** Lng/lat pairs for fitBounds. Includes the user when any spot is within 30km. */
export function workFocusLngLats(
  spots: readonly WorkFocusPoint[],
  origin: HomeOriginPoint | null,
  radiusKm = WORK_FOCUS_ORIGIN_RADIUS_KM,
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  let includeOrigin = false;
  for (const spot of spots) {
    if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) continue;
    coords.push([spot.lng, spot.lat]);
    if (
      origin &&
      haversineKm(origin.lat, origin.lng, spot.lat, spot.lng) <= radiusKm
    ) {
      includeOrigin = true;
    }
  }
  if (includeOrigin && origin) coords.push([origin.lng, origin.lat]);
  return coords;
}
