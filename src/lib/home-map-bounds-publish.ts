import type { Map as MapLibreMap } from "maplibre-gl";
import type { HomeBoundsDetail } from "~/components/home/home-events";

/**
 * Geographic bounds of the full map canvas (all four corners).
 * Used for nearby spot counts so padding from the bottom sheet does not
 * shrink the counted area to the strip above the sheet.
 */
export function geographicBoundsFromMapCanvas(map: MapLibreMap): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  const container = map.getContainer();
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width <= 0 || height <= 0) {
    const fallback = map.getBounds();
    return {
      west: fallback.getWest(),
      south: fallback.getSouth(),
      east: fallback.getEast(),
      north: fallback.getNorth(),
    };
  }
  const nw = map.unproject([0, 0]);
  const ne = map.unproject([width, 0]);
  const sw = map.unproject([0, height]);
  const se = map.unproject([width, height]);
  return {
    west: Math.min(nw.lng, ne.lng, sw.lng, se.lng),
    south: Math.min(nw.lat, ne.lat, sw.lat, se.lat),
    east: Math.max(nw.lng, ne.lng, sw.lng, se.lng),
    north: Math.max(nw.lat, ne.lat, sw.lat, se.lat),
  };
}

export function buildHomeBoundsDetail(map: MapLibreMap): HomeBoundsDetail {
  const { west, south, east, north } = geographicBoundsFromMapCanvas(map);
  const center = map.getCenter();
  return {
    west,
    south,
    east,
    north,
    lat: center.lat,
    lng: center.lng,
  };
}
