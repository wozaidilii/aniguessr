import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { ANIME_LOCALES } from "~/lib/anime-locale";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  assignSpotSeoVariants,
  type SpotSeoFields,
  type SpotSeoVariant,
} from "~/lib/pilgrimage-seo-meta";
import {
  pickLocalizedText,
  pickMaybeLocalizedText,
  pickSpotPlaceFromRecord,
  type LocalizedLines,
  type LocalizedText,
} from "~/lib/localized-text";
import {
  decodeSpotId,
  parseAnimeSlug,
  parseLocationSlug,
} from "~/lib/pilgrimage-slug";

export type { LocalizedLines, LocalizedText };
export { pickLocalizedText };

export interface PilgrimageAnimeSummary {
  subjectId: string;
  subjectIds?: string[];
  slug: string;
  animeTitle: LocalizedText;
  spotCount: number;
  locationCount: number;
  years: number[];
}

export interface PilgrimageLocationSummary {
  slug: string;
  name: LocalizedText;
  spotCount: number;
  animeCount: number;
  /** True when the municipality ring steps into the sea. Unknown stays city art. */
  isCoastal?: boolean;
}

export interface PilgrimageSpot {
  id: string;
  subjectId: string;
  workSubjectId?: string;
  subjectSlug: string;
  locationSlug: string;
  redirectTo?: string | null;
  lat: number;
  lng: number;
  year: number | null;
  difficulty: number | null;
  confidence: string;
  imagePath: string | null;
  sourceUrl: string | null;
  title: LocalizedText;
  description: LocalizedText;
  animeTitle: LocalizedText;
  location: LocalizedText;
  answerName: LocalizedText;
  aspect: string | null;
  episodeContext: LocalizedText | string | null;
  funfact: LocalizedLines | string[];
}

export interface PilgrimageSeoIndex {
  generatedAt: string;
  sourceQuestionCount: number;
  spotCount: number;
  animeCount: number;
  locationCount: number;
  animes: PilgrimageAnimeSummary[];
  locations: PilgrimageLocationSummary[];
  locationRedirects?: Record<string, string>;
  spotIds: string[];
  spots: Record<string, PilgrimageSpot>;
}

const INDEX_PATH = path.join(process.cwd(), "public/data/seo/index.json");

let cachedIndex: PilgrimageSeoIndex | null = null;

function isPilgrimageSeoIndex(value: unknown): value is PilgrimageSeoIndex {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PilgrimageSeoIndex>;
  return (
    Array.isArray(item.animes) &&
    Array.isArray(item.locations) &&
    Array.isArray(item.spotIds) &&
    item.spots !== null &&
    typeof item.spots === "object"
  );
}

/** 读取构建时生成的 SEO 索引（进程内缓存，避免重复读盘） */
export function getPilgrimageSeoIndex(): PilgrimageSeoIndex | null {
  if (cachedIndex) return cachedIndex;
  try {
    const raw = readFileSync(INDEX_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isPilgrimageSeoIndex(parsed)) return null;
    cachedIndex = parsed;
    return cachedIndex;
  } catch {
    return null;
  }
}

export function getAnimeBySlug(slug: string): PilgrimageAnimeSummary | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  const subjectId = parseAnimeSlug(slug);
  if (subjectId) {
    const match = index.animes.find(
      (item) =>
        item.subjectId === subjectId || item.subjectIds?.includes(subjectId),
    );
    if (match) return match;
  }
  return index.animes.find((item) => item.slug === slug) ?? null;
}

export function getLocationBySlug(
  slug: string,
): PilgrimageLocationSummary | null {
  return resolveLocationSlug(slug)?.location ?? null;
}

/** Current location, plus whether this slug should 301 to `location.slug`. */
export function resolveLocationSlug(slug: string): {
  location: PilgrimageLocationSummary;
  redirect: boolean;
} | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  const decoded = parseLocationSlug(slug);
  const direct =
    index.locations.find(
      (item) => item.slug === slug || item.slug === decoded,
    ) ?? null;
  if (direct) {
    return {
      location: direct,
      redirect: slug !== direct.slug && decoded !== direct.slug,
    };
  }
  const target =
    index.locationRedirects?.[slug] ??
    index.locationRedirects?.[decoded] ??
    index.locationRedirects?.[encodeURIComponent(decoded)];
  if (!target) return null;
  const location = index.locations.find((item) => item.slug === target);
  if (!location) return null;
  return { location, redirect: true };
}

export function getSpotById(encodedId: string): PilgrimageSpot | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  const id = decodeSpotId(encodedId);
  const spot = index.spots[id];
  return spot ?? null;
}

export function listSpotsForAnime(subjectId: string): PilgrimageSpot[] {
  const index = getPilgrimageSeoIndex();
  if (!index) return [];
  return index.spotIds
    .map((id) => index.spots[id])
    .filter((spot): spot is PilgrimageSpot => {
      if (!spot || spot.redirectTo) return false;
      return spot.workSubjectId === subjectId || spot.subjectId === subjectId;
    });
}

export function listSpotsForLocation(locationSlug: string): PilgrimageSpot[] {
  const index = getPilgrimageSeoIndex();
  if (!index) return [];
  const decodedName = parseLocationSlug(locationSlug);
  return index.spotIds
    .map((id) => index.spots[id])
    .filter((spot): spot is PilgrimageSpot => {
      if (!spot || spot.redirectTo) return false;
      return (
        spot.locationSlug === locationSlug ||
        spot.locationSlug === decodedName ||
        pickLocalizedText(spot.location, "zh") === decodedName
      );
    });
}

let spotVariantCache: Map<string, SpotSeoVariant> | null = null;
let ambiguousAnimeTitles: Set<string> | null = null;

function spotFields(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
): SpotSeoFields {
  return {
    id: spot.id,
    anime: pickLocalizedText(spot.animeTitle, locale),
    place: pickSpotPlaceFromRecord(spot.answerName, spot.title, locale),
    area: pickLocalizedText(spot.location, locale),
    episode: pickMaybeLocalizedText(spot.episodeContext, locale),
    scene: pickLocalizedText(spot.title, locale),
  };
}

const SEO_LOCALES: readonly PilgrimageLocale[] = [...ANIME_LOCALES, "zh-tw"];

function ensureSpotVariantCache(index: PilgrimageSeoIndex) {
  if (spotVariantCache) return;
  const cache = new Map<string, SpotSeoVariant>();
  for (const locale of SEO_LOCALES) {
    const fields = index.spotIds.flatMap((id) => {
      const spot = index.spots[id];
      if (!spot) return [];
      return [spotFields(spot, locale)];
    });
    for (const [id, variant] of assignSpotSeoVariants(fields)) {
      cache.set(`${locale}:${id}`, variant);
    }
  }
  spotVariantCache = cache;
}

export function getSpotSeoVariant(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
): SpotSeoVariant {
  const index = getPilgrimageSeoIndex();
  if (!index) return "base";
  ensureSpotVariantCache(index);
  return spotVariantCache?.get(`${locale}:${spot.id}`) ?? "base";
}

export function animeTitleIsAmbiguous(title: string): boolean {
  const index = getPilgrimageSeoIndex();
  if (!index) return false;
  if (!ambiguousAnimeTitles) {
    const counts = new Map<string, number>();
    for (const anime of index.animes) {
      for (const title of [
        anime.animeTitle.zh,
        anime.animeTitle.ja,
        anime.animeTitle.en,
        anime.animeTitle.tw,
      ]) {
        if (!title) continue;
        counts.set(title, (counts.get(title) ?? 0) + 1);
      }
    }
    ambiguousAnimeTitles = new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([name]) => name),
    );
  }
  return ambiguousAnimeTitles.has(title);
}
