import { readFile } from "node:fs/promises";
import path from "node:path";
import { haversineMeters } from "./pilgrimage-group.mjs";

export const SPOT_TIER_A_SOURCE = "data/index-quality/tier-a-spot-ids.json";
export const SAME_WORK_MERGES_SOURCE = "data/index-quality/same-work-merges.json";
export const EXISTING_REDIRECT_FLATTEN_SOURCE =
  "data/index-quality/existing-redirect-flatten.json";
export const NO_301_DUPLICATES_SOURCE =
  "data/index-quality/no-301-duplicates.json";

export const WORK_MIN_TIER_A = 3;
export const LOCATION_MIN_TIER_A = 5;
export const MERGE_MAX_DISTANCE_M = 30;
export const ZH_SPOTS_INDEXABLE = false;
export const GAME_HUB_INDEXABLE = false;

/** Release date (JST) for sitemap lastmod on URLs affected by index shrink. */
export const SITEMAP_INDEX_SHRINK_LASTMOD = "2026-11-01";

/** Must stay indexable; must not appear as merge keys. */
export const TRAFFIC_MERGE_EXEMPT_SPOT_IDS = [
  "anitabi_1377_aj3sr15",
  "anitabi_1377_kq95fpnp8",
  "anitabi_430699_rlp0q609v",
  "anitabi_507806_p38boi6k7",
];

const SPOT_INDEXABLE_LOCALES = ["ja", "en", "zh-tw"];

export async function loadTierASpotIds(root = process.cwd()) {
  const raw = await readFile(path.join(root, SPOT_TIER_A_SOURCE), "utf8");
  const ids = JSON.parse(raw);
  if (!Array.isArray(ids)) {
    throw new Error(`${SPOT_TIER_A_SOURCE} must be a JSON array`);
  }
  return new Set(ids.map(String));
}

export async function loadSameWorkMergeMap(root = process.cwd()) {
  const raw = await readFile(path.join(root, SAME_WORK_MERGES_SOURCE), "utf8");
  const map = JSON.parse(raw);
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    throw new Error(`${SAME_WORK_MERGES_SOURCE} must be a JSON object`);
  }
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [String(key), String(value)]),
  );
}

function visibleSpot(spots, id) {
  const spot = spots[id];
  if (!spot) return null;
  if (spot.redirectTo && spot.redirectTo !== spot.id) return null;
  return spot;
}

function spotWorkId(spot) {
  return spot.workSubjectId ?? spot.subjectId;
}

/**
 * @param {Record<string, any>} spots
 * @param {Set<string>} tierA
 * @param {Record<string, string>} mergeMap
 */
export function validateIndexQualityData(spots, tierA, mergeMap) {
  for (const id of tierA) {
    if (!visibleSpot(spots, id)) {
      throw new Error(`tier-A id is not a visible spot: ${id}`);
    }
  }
  for (const [duplicateId, canonicalId] of Object.entries(mergeMap)) {
    const duplicate = spots[duplicateId];
    if (!duplicate) {
      throw new Error(`merge key is not a spot: ${duplicateId}`);
    }
    const canonical = visibleSpot(spots, canonicalId);
    if (!canonical) {
      throw new Error(`merge target is not a visible spot: ${canonicalId}`);
    }
    if (mergeMap[canonicalId]) {
      throw new Error(`merge target is itself a merge key: ${canonicalId}`);
    }
    if (tierA.has(duplicateId)) {
      throw new Error(`merge key is tier A: ${duplicateId}`);
    }
    if (!tierA.has(canonicalId)) {
      throw new Error(`merge target is not tier A: ${canonicalId}`);
    }
    if (TRAFFIC_MERGE_EXEMPT_SPOT_IDS.includes(duplicateId)) {
      throw new Error(`traffic id cannot be a merge key: ${duplicateId}`);
    }
    if (spotWorkId(duplicate) !== spotWorkId(canonical)) {
      throw new Error(`merge pair is not same work: ${duplicateId}`);
    }
    const distance = haversineMeters(duplicate, canonical);
    if (distance > MERGE_MAX_DISTANCE_M) {
      throw new Error(
        `merge pair exceeds ${MERGE_MAX_DISTANCE_M}m (${distance.toFixed(1)}m): ${duplicateId}`,
      );
    }
  }
}

/**
 * @param {Record<string, { id: string, redirectTo?: string | null, mergedFrom?: string[] }>} spots
 * @param {Record<string, string>} mergeMap
 */
export function applySameWorkMerges(spots, mergeMap) {
  for (const spot of Object.values(spots)) {
    delete spot.mergedFrom;
  }
  for (const [duplicateId, canonicalId] of Object.entries(mergeMap)) {
    const duplicate = spots[duplicateId];
    const canonical = spots[canonicalId];
    if (!duplicate || !canonical) continue;
    duplicate.redirectTo = canonicalId;
    const list = canonical.mergedFrom ?? [];
    list.push(duplicateId);
    canonical.mergedFrom = list;
  }
}

/**
 * @param {Record<string, { id: string, redirectTo?: string | null }>} spots
 */
export function flattenRedirectChains(spots) {
  const resolve = (id, stack = new Set()) => {
    const spot = spots[id];
    if (!spot?.redirectTo || spot.redirectTo === spot.id) return id;
    if (stack.has(id)) {
      throw new Error(`redirect cycle at ${id}`);
    }
    stack.add(id);
    return resolve(spot.redirectTo, stack);
  };
  for (const spot of Object.values(spots)) {
    if (!spot.redirectTo || spot.redirectTo === spot.id) continue;
    spot.redirectTo = resolve(spot.redirectTo);
  }
  for (const spot of Object.values(spots)) {
    if (!spot.redirectTo || spot.redirectTo === spot.id) continue;
    const target = spots[spot.redirectTo];
    if (target?.redirectTo && target.redirectTo !== target.id) {
      throw new Error(`redirect target is not final: ${spot.id} -> ${spot.redirectTo}`);
    }
  }
}

export function spotIsTierA(spot, tierA) {
  return tierA.has(spot.id);
}

/**
 * @param {Record<string, any>} spots
 * @param {Set<string>} tierA
 */
export function annotateSpotIndexQuality(spots, tierA) {
  for (const spot of Object.values(spots)) {
    if (spot.redirectTo) {
      spot.indexable = false;
      continue;
    }
    spot.indexable = tierA.has(spot.id);
  }
}

function tierACountForWork(spots, tierA, workSubjectId) {
  let count = 0;
  for (const spot of Object.values(spots)) {
    if (spot.redirectTo) continue;
    if (spot.workSubjectId !== workSubjectId && spot.subjectId !== workSubjectId) {
      continue;
    }
    if (tierA.has(spot.id)) count += 1;
  }
  return count;
}

function tierACountForLocation(spots, tierA, locationSlug) {
  let count = 0;
  for (const spot of Object.values(spots)) {
    if (spot.redirectTo) continue;
    if (spot.locationSlug !== locationSlug) continue;
    if (tierA.has(spot.id)) count += 1;
  }
  return count;
}

/**
 * @param {Array<any>} animes
 * @param {Array<any>} locations
 * @param {Record<string, any>} spots
 * @param {Set<string>} tierA
 */
export function annotateWorkAndLocationIndexQuality(
  animes,
  locations,
  spots,
  tierA,
) {
  for (const anime of animes) {
    const tierACount = tierACountForWork(spots, tierA, anime.subjectId);
    anime.tierACount = tierACount;
    anime.indexable = tierACount >= WORK_MIN_TIER_A;
  }
  for (const location of locations) {
    const tierACount = tierACountForLocation(spots, tierA, location.slug);
    location.tierACount = tierACount;
    location.indexable = tierACount >= LOCATION_MIN_TIER_A;
  }
}

function visibleSpotIdsForWork(spots, workSubjectId) {
  return Object.values(spots)
    .filter(
      (spot) =>
        !spot.redirectTo &&
        (spot.workSubjectId === workSubjectId ||
          spot.subjectId === workSubjectId),
    )
    .map((spot) => spot.id)
    .sort();
}

function visibleSpotIdsForLocation(spots, locationSlug) {
  return Object.values(spots)
    .filter((spot) => !spot.redirectTo && spot.locationSlug === locationSlug)
    .map((spot) => spot.id)
    .sort();
}

function workMembershipBeforeMerges(spots, mergeMap, workSubjectId) {
  const ids = visibleSpotIdsForWork(spots, workSubjectId);
  for (const duplicateId of Object.keys(mergeMap)) {
    const spot = spots[duplicateId];
    if (!spot) continue;
    const workId = spot.workSubjectId ?? spot.subjectId;
    if (workId !== workSubjectId) continue;
    ids.push(duplicateId);
  }
  return [...new Set(ids)].sort();
}

function locationMembershipBeforeMerges(spots, mergeMap, locationSlug) {
  const ids = visibleSpotIdsForLocation(spots, locationSlug);
  for (const duplicateId of Object.keys(mergeMap)) {
    const spot = spots[duplicateId];
    if (!spot || spot.locationSlug !== locationSlug) continue;
    ids.push(duplicateId);
  }
  return [...new Set(ids)].sort();
}

/**
 * @param {object} params
 * @param {Record<string, string>} params.mergeMap
 * @param {Record<string, any>} params.spots
 * @param {Array<{ subjectId: string, slug: string, indexable?: boolean }>} params.animes
 * @param {Array<{ slug: string, indexable?: boolean }>} params.locations
 */
export function indexShrinkLastmodPaths({
  mergeMap,
  spots,
  animes,
  locations,
}) {
  const paths = new Set();
  for (const spot of Object.values(spots)) {
    if (!spot.indexable || !spot.mergedFrom?.length) continue;
    paths.add(`/pilgrimage/spots/${encodeURIComponent(spot.id)}`);
  }

  for (const anime of animes) {
    if (!anime.indexable) continue;
    const after = visibleSpotIdsForWork(spots, anime.subjectId).join("\n");
    const prior = workMembershipBeforeMerges(
      spots,
      mergeMap,
      anime.subjectId,
    ).join("\n");
    if (prior !== after) {
      paths.add(`/pilgrimage/anime/${anime.slug}`);
    }
  }
  for (const location of locations) {
    if (!location.indexable) continue;
    const after = visibleSpotIdsForLocation(spots, location.slug).join("\n");
    const prior = locationMembershipBeforeMerges(
      spots,
      mergeMap,
      location.slug,
    ).join("\n");
    if (prior !== after) {
      paths.add(`/pilgrimage/locations/${location.slug}`);
    }
  }
  return paths;
}

export function spotSitemapLocales() {
  return [...SPOT_INDEXABLE_LOCALES];
}

export function countIndexQualityReport(spots, animes, locations, tierA, mergeMap) {
  const visible = Object.values(spots).filter((spot) => !spot.redirectTo);
  const indexableSpots = visible.filter((spot) => spot.indexable).length;
  const indexableWorks = animes.filter((anime) => anime.indexable).length;
  const indexableLocations = locations.filter((loc) => loc.indexable).length;
  const mergeRedirects = Object.keys(mergeMap).length;
  const totalRedirects = Object.values(spots).filter((spot) => spot.redirectTo)
    .length;
  return {
    tierASpotIds: tierA.size,
    indexableSpots,
    indexableWorks,
    indexableLocations,
    mergeRedirects,
    totalRedirects,
  };
}
