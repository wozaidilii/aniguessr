import {
  splitLocalePath,
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import {
  decodeSpotId,
  parseAnimeSlug,
  parseLocationSlug,
} from "~/lib/pilgrimage-slug";
import redirectMapJson from "~/lib/pilgrimage-redirect-map.json";

export interface PilgrimageRedirectMap {
  animeBySubjectId: Record<string, string>;
  locations: Record<string, string>;
  spots: Record<string, string>;
}

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && item) record[key] = item;
  }
  return record;
}

export const PILGRIMAGE_REDIRECT_MAP: PilgrimageRedirectMap = {
  animeBySubjectId: asRecord(redirectMapJson.animeBySubjectId),
  locations: asRecord(redirectMapJson.locations),
  spots: asRecord(redirectMapJson.spots),
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Locale-prefixed path to 301 to, when this URL is an old anime, location, or spot slug.
 * The map is generated with the SEO index. Canonical URLs return null.
 */
export function pilgrimageRedirectPath(
  pathname: string,
  locale: PilgrimageLocale,
  map: PilgrimageRedirectMap = PILGRIMAGE_REDIRECT_MAP,
): string | null {
  const split = splitLocalePath(pathname);
  const inner = split.pathname;
  const targetLocale = split.locale ?? locale;

  const anime = /^\/pilgrimage\/anime\/([^/]+)$/u.exec(inner);
  if (anime?.[1]) {
    const slug = safeDecode(anime[1]);
    const subjectId = parseAnimeSlug(slug);
    const target = subjectId ? map.animeBySubjectId[subjectId] : undefined;
    if (!target || target === slug) return null;
    return withPilgrimageLocale(`/pilgrimage/anime/${target}`, targetLocale);
  }

  const location = /^\/pilgrimage\/locations\/([^/]+)$/u.exec(inner);
  if (location?.[1]) {
    const slug = parseLocationSlug(location[1]);
    const target = map.locations[slug] ?? map.locations[location[1]];
    if (!target || target === slug) return null;
    return withPilgrimageLocale(
      `/pilgrimage/locations/${target}`,
      targetLocale,
    );
  }

  const spot = /^\/pilgrimage\/spots\/([^/]+)$/u.exec(inner);
  if (spot?.[1]) {
    const id = decodeSpotId(spot[1]);
    const target = map.spots[id];
    if (!target || target === id) return null;
    return withPilgrimageLocale(
      `/pilgrimage/spots/${encodeURIComponent(target)}`,
      targetLocale,
    );
  }

  return null;
}
