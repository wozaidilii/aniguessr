import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import { ANIME_LOCALES, type AnimeLocale } from "~/lib/anime-locale";
import {
  assignSpotSeoVariants,
  type SpotSeoFields,
  type SpotSeoVariant,
} from "~/lib/pilgrimage-seo-meta";
import {
  decodeSpotId,
  parseAnimeSlug,
  parseLocationSlug,
} from "~/lib/pilgrimage-slug";

export interface LocalizedText {
  zh: string;
  ja: string;
  en: string;
}

export interface PilgrimageAnimeSummary {
  subjectId: string;
  slug: string;
  animeTitle: string;
  spotCount: number;
  locationCount: number;
  years: number[];
}

export interface PilgrimageLocationSummary {
  slug: string;
  name: string;
  spotCount: number;
  animeCount: number;
}

export interface PilgrimageSpot {
  id: string;
  subjectId: string;
  subjectSlug: string;
  locationSlug: string;
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
  episodeContext: string | null;
  funfact: string[];
}

export interface PilgrimageSeoIndex {
  generatedAt: string;
  sourceQuestionCount: number;
  spotCount: number;
  animeCount: number;
  locationCount: number;
  animes: PilgrimageAnimeSummary[];
  locations: PilgrimageLocationSummary[];
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

export function pickLocalizedText(
  text: LocalizedText | undefined,
  locale: AnimeLocale,
): string {
  if (!text) return "";
  return text[locale] || text.en || text.zh || text.ja || "";
}

export function getAnimeBySlug(slug: string): PilgrimageAnimeSummary | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  const subjectId = parseAnimeSlug(slug);
  if (subjectId) {
    return index.animes.find((item) => item.subjectId === subjectId) ?? null;
  }
  return index.animes.find((item) => item.slug === slug) ?? null;
}

export function getLocationBySlug(
  slug: string,
): PilgrimageLocationSummary | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  return (
    index.locations.find((item) => item.slug === slug) ??
    index.locations.find((item) => item.name === parseLocationSlug(slug)) ??
    null
  );
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
      if (!spot) return false;
      return spot.subjectId === subjectId;
    });
}

export function listSpotsForLocation(locationSlug: string): PilgrimageSpot[] {
  const index = getPilgrimageSeoIndex();
  if (!index) return [];
  const decodedName = parseLocationSlug(locationSlug);
  return index.spotIds
    .map((id) => index.spots[id])
    .filter((spot): spot is PilgrimageSpot => {
      if (!spot) return false;
      return (
        spot.locationSlug === locationSlug ||
        pickLocalizedText(spot.location, "zh") === decodedName
      );
    });
}

let spotVariantCache: Map<string, SpotSeoVariant> | null = null;
let ambiguousAnimeTitles: Set<string> | null = null;

function spotFields(spot: PilgrimageSpot, locale: AnimeLocale): SpotSeoFields {
  return {
    id: spot.id,
    anime: pickLocalizedText(spot.animeTitle, locale),
    place: pickLocalizedText(spot.answerName, locale),
    area: pickLocalizedText(spot.location, locale),
    episode: spot.episodeContext ?? "",
    scene: pickLocalizedText(spot.title, locale),
  };
}

function ensureSpotVariantCache(index: PilgrimageSeoIndex) {
  if (spotVariantCache) return;
  const cache = new Map<string, SpotSeoVariant>();
  for (const locale of ANIME_LOCALES) {
    const fields = index.spotIds.flatMap((id) => {
      const spot = index.spots[id];
      return spot ? [spotFields(spot, locale)] : [];
    });
    for (const [id, variant] of assignSpotSeoVariants(fields)) {
      cache.set(`${locale}:${id}`, variant);
    }
  }
  spotVariantCache = cache;
}

export function getSpotSeoVariant(
  spot: PilgrimageSpot,
  locale: AnimeLocale,
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
      counts.set(anime.animeTitle, (counts.get(anime.animeTitle) ?? 0) + 1);
    }
    ambiguousAnimeTitles = new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([name]) => name),
    );
  }
  return ambiguousAnimeTitles.has(title);
}
