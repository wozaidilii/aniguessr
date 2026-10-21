export interface HomeOriginPoint {
  lat: number;
  lng: number;
}

let lastOrigin: HomeOriginPoint | null = null;

/** Last geolocation fix. Outlives map remounts so the blue dot can be restored. */
export function rememberHomeOrigin(origin: HomeOriginPoint): void {
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return;
  lastOrigin = { lat: origin.lat, lng: origin.lng };
}

export function readHomeOrigin(): HomeOriginPoint | null {
  if (!lastOrigin) return null;
  return { lat: lastOrigin.lat, lng: lastOrigin.lng };
}

export function resetHomeOriginForTests(): void {
  lastOrigin = null;
}
