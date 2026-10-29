import { Point, type Map as MapLibreMap } from "maplibre-gl";
import type { HomeBoundsDetail } from "~/components/home/home-events";
import { publishHomeBoundsDetail } from "~/lib/home-bounds-store";

type ClonedTransform = {
  setPadding(padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }): void;
  width: number;
  height: number;
  screenPointToLocation(p: Point): { lng: number; lat: number };
};

function boundsFromCorners(
  nw: { lng: number; lat: number },
  ne: { lng: number; lat: number },
  sw: { lng: number; lat: number },
  se: { lng: number; lat: number },
): { west: number; south: number; east: number; north: number } {
  return {
    west: Math.min(nw.lng, ne.lng, sw.lng, se.lng),
    south: Math.min(nw.lat, ne.lat, sw.lat, se.lat),
    east: Math.max(nw.lng, ne.lng, sw.lng, se.lng),
    north: Math.max(nw.lat, ne.lat, sw.lat, se.lat),
  };
}

function cornersFromUnpaddedTransform(map: MapLibreMap): {
  west: number;
  south: number;
  east: number;
  north: number;
} | null {
  if (!map.transform) return null;
  const cloneFn = (
    map.transform as unknown as { clone?: () => ClonedTransform }
  ).clone;
  if (!cloneFn) return null;
  const transform = cloneFn.call(map.transform);
  transform.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  const width = transform.width;
  const height = transform.height;
  if (width <= 0 || height <= 0) return null;
  const nw = transform.screenPointToLocation(new Point(0, 0));
  const ne = transform.screenPointToLocation(new Point(width, 0));
  const sw = transform.screenPointToLocation(new Point(0, height));
  const se = transform.screenPointToLocation(new Point(width, height));
  return boundsFromCorners(nw, ne, sw, se);
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
  return boundsFromCorners(nw, ne, sw, se);
}

/**
 * Geographic bounds of the full map canvas (all four corners).
 * Uses a zero-padding transform clone so sheet/camera padding does not shrink bounds.
 */
export function geographicBoundsFromMapCanvas(map: MapLibreMap): {
  west: number;
  south: number;
  east: number;
  north: number;
} {
  return cornersFromUnpaddedTransform(map) ?? cornersFromContainer(map);
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

let publishing = false;

export function resetHomeMapBoundsPublishForTests(): void {
  publishing = false;
}

/** Publish bounds for the nearby list using canvas-corner geography. */
export function publishHomeMapBounds(
  map: MapLibreMap,
  detail?: HomeBoundsDetail,
): void {
  if (publishing) return;
  publishing = true;
  try {
    publishHomeBoundsDetail(detail ?? buildHomeBoundsDetail(map));
  } finally {
    publishing = false;
  }
}
