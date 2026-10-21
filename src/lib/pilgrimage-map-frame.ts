/** All-of-Japan camera. A work page must not open wider than this. */
export const PILGRIMAGE_JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [122.9, 24.0],
  [145.8, 45.6],
];

export const PILGRIMAGE_FIT_PADDING = 40;
export const PILGRIMAGE_FIT_MAX_ZOOM = 15;

/**
 * Fit the work or area spots, but never zoom out past the Japan frame.
 * `spotZoom` is the zoom MapLibre would use for those spots (already capped
 * by maxZoom). A null zoom means there is nothing to frame.
 */
export function pilgrimageFitTarget(
  spotZoom: number | null,
  japanZoom: number,
): "spots" | "japan" {
  if (spotZoom == null || !Number.isFinite(spotZoom)) return "japan";
  if (spotZoom < japanZoom) return "japan";
  return "spots";
}

/** Drop coordinates outside Japan so one bad point cannot frame East Asia. */
export function pilgrimageSpotBounds(
  spots: readonly { lng: number; lat: number }[],
): [[number, number], [number, number]] | null {
  const [[minLng, minLat], [maxLng, maxLat]] = PILGRIMAGE_JAPAN_BOUNDS;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let count = 0;
  for (const spot of spots) {
    if (
      spot.lng < minLng ||
      spot.lng > maxLng ||
      spot.lat < minLat ||
      spot.lat > maxLat
    ) {
      continue;
    }
    west = Math.min(west, spot.lng);
    south = Math.min(south, spot.lat);
    east = Math.max(east, spot.lng);
    north = Math.max(north, spot.lat);
    count += 1;
  }
  if (count === 0) return null;
  return [
    [west, south],
    [east, north],
  ];
}
