const LOCALE_PREFIX = /^\/(?:zh-tw|zh|ja|en)(?=\/|$)/u;

/** Date already published for pilgrimage URLs. Unchanged pages keep it. */
export const SITEMAP_BASELINE_LASTMOD = "2026-10-21";

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
