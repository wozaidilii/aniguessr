import type { Map as MapLibreMap } from "maplibre-gl";
import type { HomeBoundsDetail } from "~/components/home/home-events";
import { publishHomeBoundsDetail } from "~/lib/home-bounds-store";

type MapPadding = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

function normalizeMapPadding(padding: MapPadding): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  return {
    top: padding.top ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
    right: padding.right ?? 0,
  };
}

function hasMapPadding(padding: MapPadding): boolean {
  const normalized = normalizeMapPadding(padding);
  return (
    normalized.top > 0 ||
    normalized.bottom > 0 ||
    normalized.left > 0 ||
    normalized.right > 0
  );
}

function cornersFromContainer(map: MapLibreMap): {
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
  const padding = normalizeMapPadding(map.getPadding());
  if (!hasMapPadding(padding)) {
    return cornersFromContainer(map);
  }
  map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  try {
    return cornersFromContainer(map);
  } finally {
    map.setPadding(padding);
  }
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

/** Publish bounds for the nearby list using canvas-corner geography. */
export function publishHomeMapBounds(map: MapLibreMap): void {
  publishHomeBoundsDetail(buildHomeBoundsDetail(map));
}
