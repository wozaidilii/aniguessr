import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

export const ANITABI_SITE = "https://anitabi.cn";
export const CC_BY_NC_SA_4_URL =
  "https://creativecommons.org/licenses/by-nc-sa/4.0/";
export const PILGRIMAGE_MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
export const SPOTS_NAV_URL = "/data/seo/spots-nav.json";

export interface NavText {
  zh: string;
  ja: string;
  en: string;
  tw?: string;
}

export interface NavSpot {
  id: string;
  subjectId: string;
  locationSlug: string;
  lat: number;
  lng: number;
  name: NavText;
}

export interface NavCatalog {
  animes: Record<string, NavText>;
  spots: NavSpot[];
}

export interface NearbySpot extends NavSpot {
  distanceKm: number;
}

const EMPTY_TEXT: NavText = { zh: "", ja: "", en: "" };

export function anitabiUrlFromSpotId(id: string, subjectId: string): string {
  const embedded = /^anitabi_(\d+)_(.+)$/u.exec(id);
  const bangumiId = embedded?.[1] || subjectId;
  const pid = embedded?.[2] ?? "";
  if (!bangumiId || !pid) return ANITABI_SITE;
  return `https://anitabi.cn/map?bangumiId=${encodeURIComponent(bangumiId)}&pid=${encodeURIComponent(pid)}`;
}

export function anitabiAnimeUrl(subjectId: string): string {
  if (!subjectId) return ANITABI_SITE;
  return `https://anitabi.cn/map?bangumiId=${encodeURIComponent(subjectId)}`;
}

/** Prefer a real anitabi spot URL. Otherwise send people to the anitabi site. */
export function anitabiSourceUrl(sourceUrl?: string | null): string {
  if (sourceUrl?.startsWith("https://anitabi.cn/")) return sourceUrl;
  return ANITABI_SITE;
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Official Maps URLs API panorama link. No key and no extra request. */
export function googleStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

export function localizedNavText(
  text: NavText,
  locale: PilgrimageLocale,
): string {
  if (locale === "zh-tw") return text.tw || text.ja || text.en || "";
  return text[locale] || text.en || text.zh || text.ja || "";
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function tupleToText(value: unknown): NavText | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const text: NavText = {
    zh: asText(value[0]),
    ja: asText(value[1]),
    en: asText(value[2]),
  };
  if (value.length > 3) text.tw = asText(value[3]);
  return text;
}

export function parseNavCatalog(value: unknown): NavCatalog {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid navigation catalog");
  }
  const record = value as {
    version?: unknown;
    animes?: unknown;
    spots?: unknown;
  };
  if (record.version !== 1 || !Array.isArray(record.spots)) {
    throw new Error("Invalid navigation catalog");
  }

  const animes: Record<string, NavText> = {};
  if (record.animes && typeof record.animes === "object") {
    for (const [id, titles] of Object.entries(
      record.animes as Record<string, unknown>,
    )) {
      const text = tupleToText(titles);
      if (text) animes[id] = text;
    }
  }

  const spots: NavSpot[] = [];
  for (const row of record.spots) {
    if (!Array.isArray(row) || row.length < 8) continue;
    const lat = Number(row[3]);
    const lng = Number(row[4]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    spots.push({
      id: asText(row[0]),
      subjectId: asText(row[1]),
      locationSlug: asText(row[2]),
      lat,
      lng,
      name: {
        zh: asText(row[5]),
        ja: asText(row[6]),
        en: asText(row[7]),
        tw: row.length > 8 ? asText(row[8]) : "",
      },
    });
  }

  return { animes, spots };
}

export function filterNavSpots(
  spots: readonly NavSpot[],
  options: {
    subjectId?: string;
    locationSlug?: string;
    favoriteIds?: readonly string[];
    favoritesOnly?: boolean;
  },
): NavSpot[] {
  const favorites = new Set(options.favoriteIds ?? []);
  return spots.filter((spot) => {
    if (options.subjectId && spot.subjectId !== options.subjectId) return false;
    if (options.locationSlug && spot.locationSlug !== options.locationSlug) {
      return false;
    }
    if (options.favoritesOnly && !favorites.has(spot.subjectId)) return false;
    return true;
  });
}

export function rankNearbySpots(
  spots: readonly NavSpot[],
  origin: { lat: number; lng: number },
  favoriteIds: readonly string[],
  limits: { favorites: number; others: number } = { favorites: 20, others: 20 },
): NearbySpot[] {
  const favorite = new Set(favoriteIds);
  const favorites: NearbySpot[] = [];
  const others: NearbySpot[] = [];
  for (const spot of spots) {
    const item: NearbySpot = {
      ...spot,
      distanceKm: haversineKm(origin.lat, origin.lng, spot.lat, spot.lng),
    };
    if (favorite.has(spot.subjectId)) favorites.push(item);
    else others.push(item);
  }
  favorites.sort((a, b) => a.distanceKm - b.distanceKm);
  others.sort((a, b) => a.distanceKm - b.distanceKm);
  return [
    ...favorites.slice(0, limits.favorites),
    ...others.slice(0, limits.others),
  ];
}

export function animeTitle(
  animes: Record<string, NavText>,
  subjectId: string,
  locale: PilgrimageLocale,
): string {
  return localizedNavText(animes[subjectId] ?? EMPTY_TEXT, locale);
}

let catalogRequest: Promise<NavCatalog> | null = null;

/** Shared browser fetch. Location is not part of the request. */
export function loadNavCatalog(): Promise<NavCatalog> {
  catalogRequest ??= fetch(SPOTS_NAV_URL)
    .then(async (response) => {
      if (!response.ok) throw new Error(`spots-nav ${response.status}`);
      return parseNavCatalog(await response.json());
    })
    .catch((error: unknown) => {
      catalogRequest = null;
      throw error;
    });
  return catalogRequest;
}
