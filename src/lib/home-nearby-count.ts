import type { NavCatalog } from "~/lib/pilgrimage-nav";
import type { HomeBoundsDetail } from "~/components/home/home-events";
import type { HomeFocusWorkDetail } from "~/components/home/home-events";
import { clusterSamePlaces, haversineKm } from "~/lib/pilgrimage-nav";

export interface HomeNearbyCountResult {
  inView: number;
  rankedCount: number;
}

/** Pure nearby count used by HomeNearby and tests. */
export function countHomeNearbyPlaces(
  catalog: NavCatalog,
  detail: HomeBoundsDetail,
  focus: HomeFocusWorkDetail,
): HomeNearbyCountResult {
  const focused = focus.subjectId
    ? catalog.spots.filter((spot) => spot.subjectId === focus.subjectId)
    : catalog.spots.filter(
        (spot) =>
          spot.lng >= detail.west &&
          spot.lng <= detail.east &&
          spot.lat >= detail.south &&
          spot.lat <= detail.north,
      );
  const ranked = focused
    .map((spot) => ({
      ...spot,
      distanceKm: haversineKm(detail.lat, detail.lng, spot.lat, spot.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  const groups = clusterSamePlaces(ranked);
  return { inView: groups.length, rankedCount: ranked.length };
}
