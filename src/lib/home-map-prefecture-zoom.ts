import type { HomeMapLabel } from "~/lib/home-map-labels";
import { HOME_MAP_AREA_BADGE_MIN_ZOOM } from "~/lib/home-map-area-badge-format";
import { prefectureKey, workFocusFrame } from "~/lib/home-map-focus";

export interface MapBoundsBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Mainland-focused bounds from a prefecture's area badges (drops outlying islands). */
export function prefectureZoomBounds(
  prefectureId: string,
  areas: readonly HomeMapLabel[],
  fallback: HomeMapLabel,
): MapBoundsBox {
  const points = areas
    .filter((area) => prefectureKey(area.id) === prefectureId)
    .map((area) => ({ lng: area.lng, lat: area.lat }));
  const frame = workFocusFrame(points);
  if (frame) {
    return {
      west: frame.west,
      south: frame.south,
      east: frame.east,
      north: frame.north,
    };
  }
  return {
    west: fallback.west,
    south: fallback.south,
    east: fallback.east,
    north: fallback.north,
  };
}

/** Prefecture badge clicks must land at area-badge zoom or tighter. */
export function prefectureFocusZoom(cameraZoom: number): number {
  if (!Number.isFinite(cameraZoom)) return HOME_MAP_AREA_BADGE_MIN_ZOOM;
  return Math.max(cameraZoom, HOME_MAP_AREA_BADGE_MIN_ZOOM);
}
