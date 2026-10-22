import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { applySpotDisplayName } from "~/lib/spot-name-overrides";

export const ANITABI_SITE = "https://anitabi.cn";
export const CC_BY_NC_SA_4_URL =
  "https://creativecommons.org/licenses/by-nc-sa/4.0/";
export const PILGRIMAGE_MAP_STYLE =
  "https://tiles.openfreemap.org/styles/positron";
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
  const bangumiId = embedded?.[1] ?? subjectId;
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

function firstFilled(values: Array<string | undefined>): string {
  for (const value of values) {
    if (value?.trim()) return value;
  }
  return "";
}

export function localizedNavText(
  text: NavText,
  locale: PilgrimageLocale,
): string {
  if (locale === "zh-tw") return firstFilled([text.tw, text.ja, text.en]);
  if (locale === "ja") return firstFilled([text.ja, text.zh, text.tw, text.en]);
  return firstFilled([text[locale], text.en, text.zh, text.ja]);
}

/** Nav label, then the per-spot display-name file for that locale only. */
export function localizedSpotName(
  spot: { id: string; name: NavText },
  locale: PilgrimageLocale,
): string {
  return applySpotDisplayName(
    locale,
    spot.id,
    localizedNavText(spot.name, locale),
  );
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

/** Spots this close, with similar names, are one place in nearby lists. */
export const SAME_PLACE_METERS = 30;

function normalizePlaceName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[（(][^）)]*[）)]/gu, "")
    .replace(/[\s・･、,，。．.ー\-－]/gu, "")
    .replace(/の/gu, "")
    .toLowerCase();
}

function placeNameForms(name: NavText): string[] {
  return [name.ja, name.zh, name.tw ?? ""]
    .map((value) => normalizePlaceName(value))
    .filter((value) => value.length >= 3);
}

/** True when one stored name contains the other after light normalization. */
export function placeNamesSimilar(left: NavText, right: NavText): boolean {
  const formsA = placeNameForms(left);
  const formsB = placeNameForms(right);
  for (const a of formsA) {
    for (const b of formsB) {
      if (a === b) return true;
      const shorter = a.length <= b.length ? a : b;
      const longer = a.length <= b.length ? b : a;
      if (shorter.length >= 3 && longer.includes(shorter)) return true;
    }
  }
  return false;
}

/**
 * Cluster a distance-sorted list. The first member of each group stays first,
 * so a nearest-first list keeps the closest spot as the card.
 */
export function clusterSamePlaces<
  T extends { lat: number; lng: number; name: NavText },
>(spots: readonly T[], meters = SAME_PLACE_METERS): T[][] {
  const count = spots.length;
  const parent = Array.from({ length: count }, (_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root] ?? root;
    let cursor = index;
    while (cursor !== root) {
      const next = parent[cursor] ?? root;
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };
  const union = (left: number, right: number) => {
    let a = find(left);
    let b = find(right);
    if (a === b) return;
    if (a > b) [a, b] = [b, a];
    parent[b] = a;
  };

  const cell = 0.0004;
  const buckets = new Map<string, number[]>();
  for (let index = 0; index < count; index += 1) {
    const spot = spots[index];
    if (!spot) continue;
    const key = `${Math.floor(spot.lat / cell)}:${Math.floor(spot.lng / cell)}`;
    const list = buckets.get(key);
    if (list) list.push(index);
    else buckets.set(key, [index]);
  }

  for (let index = 0; index < count; index += 1) {
    const spot = spots[index];
    if (!spot) continue;
    const latCell = Math.floor(spot.lat / cell);
    const lngCell = Math.floor(spot.lng / cell);
    for (let dLat = -1; dLat <= 1; dLat += 1) {
      for (let dLng = -1; dLng <= 1; dLng += 1) {
        const list = buckets.get(`${latCell + dLat}:${lngCell + dLng}`);
        if (!list) continue;
        for (const other of list) {
          if (other <= index) continue;
          const candidate = spots[other];
          if (!candidate) continue;
          const distance =
            haversineKm(spot.lat, spot.lng, candidate.lat, candidate.lng) *
            1000;
          if (distance > meters) continue;
          if (!placeNamesSimilar(spot.name, candidate.name)) continue;
          union(index, other);
        }
      }
    }
  }

  const groups = new Map<number, T[]>();
  const order: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const spot = spots[index];
    if (!spot) continue;
    const root = find(index);
    const list = groups.get(root);
    if (list) list.push(spot);
    else {
      groups.set(root, [spot]);
      order.push(root);
    }
  }
  return order.map((root) => groups.get(root) ?? []);
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

const TITLE_BRACKETS: ReadonlyArray<readonly [string, string]> = [
  ["『", "』"],
  ["「", "」"],
  ["《", "》"],
  ["“", "”"],
  ['"', '"'],
];

/** Drop brackets that were stored as part of a title, once per matched pair. */
export function stripStoredTitleBrackets(value: string): string {
  let text = value.trim();
  let changed = true;
  while (changed && text.length > 0) {
    changed = false;
    for (const [open, close] of TITLE_BRACKETS) {
      if (
        text.startsWith(open) &&
        text.endsWith(close) &&
        text.length > open.length + close.length
      ) {
        text = text.slice(open.length, text.length - close.length).trim();
        changed = true;
      }
    }
  }
  return text;
}

/** ja 『』, zh/zh-tw 《》, en quotes. Stored brackets are not kept. */
export function formatWorkTitle(
  locale: PilgrimageLocale,
  title: string,
): string {
  const name = stripStoredTitleBrackets(title);
  if (!name) return "";
  if (locale === "ja") return `『${name}』`;
  if (locale === "en") return `"${name}"`;
  return `《${name}》`;
}

export const PLACE_WORK_SUBTITLE_SEPARATOR = " · ";

/**
 * Two lines of the 12px nearby subtitle at a 390px sheet.
 * A CJK character counts as 2. The text column is about 270px, so two
 * lines hold about 90 units before the line clamp.
 */
export const PLACE_WORK_SUBTITLE_BUDGET = 90;

export function workSubtitleOverflow(
  locale: PilgrimageLocale,
  hidden: number,
): string {
  if (locale === "ja") return `ほか ${hidden} 作品`;
  if (locale === "en") return `+${hidden} more`;
  return `等 ${hidden} 部`;
}

function subtitleWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    width += code > 0xff ? 2 : 1;
  }
  return width;
}

/** Work titles only, first occurrence wins. Stored brackets are not shown. */
export function dedupedWorkTitles(titles: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of titles) {
    const title = stripStoredTitleBrackets(raw);
    if (!title || seen.has(title)) continue;
    seen.add(title);
    unique.push(title);
  }
  return unique;
}

/**
 * One subtitle for a same-place card. Titles that do not fit two lines are
 * counted in the locale overflow label. A single leftover title is shown,
 * because collapsing one title is never shorter than showing it.
 */
export function formatPlaceWorkSubtitle(
  titles: readonly string[],
  locale: PilgrimageLocale,
  budget = PLACE_WORK_SUBTITLE_BUDGET,
): string {
  const unique = dedupedWorkTitles(titles);
  if (unique.length === 0) return "";
  const joined = unique.join(PLACE_WORK_SUBTITLE_SEPARATOR);
  if (subtitleWidth(joined) <= budget || unique.length < 3) return joined;

  const withoutLast = unique
    .slice(0, -1)
    .join(PLACE_WORK_SUBTITLE_SEPARATOR);
  if (subtitleWidth(withoutLast) <= budget) return joined;

  for (let count = unique.length - 2; count >= 1; count -= 1) {
    const hidden = unique.length - count;
    const label = workSubtitleOverflow(locale, hidden);
    const head = unique
      .slice(0, count)
      .join(PLACE_WORK_SUBTITLE_SEPARATOR);
    const text = `${head}${PLACE_WORK_SUBTITLE_SEPARATOR}${label}`;
    if (subtitleWidth(text) <= budget) return text;
  }

  const label = workSubtitleOverflow(locale, unique.length - 1);
  const first = unique[0] ?? "";
  return `${first}${PLACE_WORK_SUBTITLE_SEPARATOR}${label}`;
}

export function workSpotCountLabel(
  locale: PilgrimageLocale,
  count: number,
): string {
  if (locale === "ja") return `（${count}か所）`;
  if (locale === "zh") return `（${count}处）`;
  if (locale === "zh-tw") return `（${count}處）`;
  return ` (${count} spots)`;
}

export interface GroupedPlaceSpot {
  id: string;
  href: string;
  place: string;
}

export interface GroupedPlaceWork {
  key: string;
  title: string;
  countLabel: string;
  spots: GroupedPlaceSpot[];
}

/** One entry per work. Several spots of that work stay on the entry. */
export function groupPlaceWorks(
  spots: readonly NavSpot[],
  animes: Record<string, NavText>,
  locale: PilgrimageLocale,
  hrefFor: (id: string) => string,
): GroupedPlaceWork[] {
  const order: string[] = [];
  const buckets = new Map<string, NavSpot[]>();
  for (const spot of spots) {
    const key = spot.subjectId || spot.id;
    const list = buckets.get(key);
    if (list) list.push(spot);
    else {
      buckets.set(key, [spot]);
      order.push(key);
    }
  }
  return order.flatMap((key) => {
    const members = buckets.get(key);
    const first = members?.[0];
    if (!members || !first) return [];
    const raw = animeTitle(animes, first.subjectId, locale);
    const title =
      formatWorkTitle(locale, raw) || localizedSpotName(first, locale);
    return [
      {
        key,
        title,
        countLabel:
          members.length > 1 ? workSpotCountLabel(locale, members.length) : "",
        spots: members.map((item) => ({
          id: item.id,
          href: hrefFor(item.id),
          place: localizedSpotName(item, locale),
        })),
      },
    ];
  });
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
