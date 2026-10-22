const LOCALE_PREFIX = /^\/(?:zh-tw|zh|ja|en)(?=\/|$)/u;

/** Date already published for pilgrimage URLs. Unchanged pages keep it. */
export const SITEMAP_BASELINE_LASTMOD = "2026-10-21";

/**
 * Date for pages whose visible name or area membership changed.
 * The fix files record correctedOn as 2026-10-21, which is the baseline,
 * so using that value left every sitemap URL unchanged.
 */
export const SITEMAP_CONTENT_LASTMOD = "2026-10-23";

/** Pathname without the locale prefix, so sitemap locs compare to route paths. */
export function sitemapPathname(loc) {
  const url = new URL(loc);
  const bare = url.pathname.replace(LOCALE_PREFIX, "") || "/";
  return bare.startsWith("/") ? bare : `/${bare}`;
}

/** First lastmod wins. Locale alternates of one path share a date. */
export function parseSitemapLastmods(xml) {
  const previous = new Map();
  const pattern = /<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/gu;
  for (const match of xml.matchAll(pattern)) {
    const loc = match[1];
    const lastmod = match[2];
    if (!loc || !lastmod) continue;
    let path = loc;
    try {
      path = sitemapPathname(loc);
    } catch {
      continue;
    }
    if (!previous.has(path)) previous.set(path, lastmod);
  }
  return previous;
}

/**
 * Changed routes take `changedOn`. Every other route keeps its previous
 * lastmod. `fallback` is only for a path that has never been in the sitemap.
 */
export function lastmodForPath(
  path,
  { previous, changed, changedOn, fallback },
) {
  if (changed.has(path)) return changedOn;
  return previous.get(path) ?? fallback;
}

/**
 * @param {Array<[string, string, string]>} previousRows spots-nav rows
 * @param {Array<{ id: string, subjectId: string, subjectSlug?: string, locationSlug: string, redirectTo?: string | null }>} nextSpots
 */
export function changedPilgrimagePaths(previousRows, nextSpots) {
  const previousAreas = new Map();
  const previousWorks = new Map();
  for (const row of previousRows) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const id = String(row[0]);
    const subjectId = String(row[1]);
    const slug = String(row[2]);
    const area = previousAreas.get(slug) ?? [];
    area.push(id);
    previousAreas.set(slug, area);
    const work = previousWorks.get(subjectId) ?? [];
    work.push(`${id}:${slug}`);
    previousWorks.set(subjectId, work);
  }

  const nextAreas = new Map();
  const nextWorks = new Map();
  const slugBySubject = new Map();
  for (const spot of nextSpots) {
    if (!spot || spot.redirectTo) continue;
    const area = nextAreas.get(spot.locationSlug) ?? [];
    area.push(spot.id);
    nextAreas.set(spot.locationSlug, area);
    const work = nextWorks.get(spot.subjectId) ?? [];
    work.push(`${spot.id}:${spot.locationSlug}`);
    nextWorks.set(spot.subjectId, work);
    if (spot.subjectSlug) slugBySubject.set(spot.subjectId, spot.subjectSlug);
  }

  const changed = new Set();
  const areaSlugs = new Set([...previousAreas.keys(), ...nextAreas.keys()]);
  for (const slug of areaSlugs) {
    const before = (previousAreas.get(slug) ?? []).slice().sort().join("\n");
    const after = (nextAreas.get(slug) ?? []).slice().sort().join("\n");
    if (before !== after) changed.add(`/pilgrimage/locations/${slug}`);
  }

  const subjectIds = new Set([...previousWorks.keys(), ...nextWorks.keys()]);
  for (const subjectId of subjectIds) {
    const before = (previousWorks.get(subjectId) ?? [])
      .slice()
      .sort()
      .join("\n");
    const after = (nextWorks.get(subjectId) ?? []).slice().sort().join("\n");
    if (before === after) continue;
    const slug = slugBySubject.get(subjectId);
    if (slug) changed.add(`/pilgrimage/anime/${slug}`);
  }
  return changed;
}

/** Area pages with no spots are not sitemap entries. */
export function indexableLocations(locations) {
  return locations.filter((location) => (location?.spotCount ?? 0) > 0);
}

/**
 * Spot pages whose display name changed, plus an explicit membership list.
 * Area and work URLs are not inferred from the spot. A clean deploy has no
 * previous nav file, and diffing against an empty one would mark every
 * area and work URL.
 * @param {Iterable<string>} ids
 * @param {Array<{ id: string, redirectTo?: string | null }>} spots
 * @param {Iterable<string>} [membershipPaths]
 */
export function contentChangedSitemapPaths(ids, spots, membershipPaths = []) {
  const changed = renamedSpotPaths(ids, spots);
  for (const route of membershipPaths) {
    if (typeof route === "string" && route.startsWith("/")) changed.add(route);
  }
  return changed;
}

/** Spot pages whose display name changed. Area and work URLs are not included. */
export function renamedSpotPaths(ids, spots) {
  const wanted = ids instanceof Set ? ids : new Set(ids);
  const changed = new Set();
  for (const spot of spots) {
    if (!spot || spot.redirectTo || !wanted.has(spot.id)) continue;
    changed.add(`/pilgrimage/spots/${encodeURIComponent(spot.id)}`);
  }
  return changed;
}

/** Spot, area, and work pages that render a renamed spot. */
export function pathsForRenamedSpots(ids, spots) {
  const wanted = ids instanceof Set ? ids : new Set(ids);
  const changed = new Set();
  for (const spot of spots) {
    if (!spot || spot.redirectTo || !wanted.has(spot.id)) continue;
    changed.add(`/pilgrimage/spots/${encodeURIComponent(spot.id)}`);
    if (spot.locationSlug) {
      changed.add(`/pilgrimage/locations/${spot.locationSlug}`);
    }
    if (spot.subjectSlug) changed.add(`/pilgrimage/anime/${spot.subjectSlug}`);
  }
  return changed;
}
