import type { LocalizedText } from "~/lib/localized-text";
import { pickLocalizedText } from "~/lib/localized-text";
import { applySpotDisplayName } from "~/lib/spot-name-overrides";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import {
  isZhTwCoveredLocationSlug,
  withPilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import type { HomeLocale } from "~/lib/home-locale";

const AREA_LIMIT = 8;
const ANIME_CARD_LIMIT = 6;
const ANIME_TAG_LIMIT = 6;
const SEED_LIMIT = 6;
const PIN_LIMIT = 8;

export interface HomeCatalogSpot {
  id: string;
  subjectId: string;
  workSubjectId?: string;
  locationSlug: string;
  lat: number;
  lng: number;
  redirectTo?: string | null;
  answerName: LocalizedText;
  animeTitle: LocalizedText;
}

export interface HomeCatalogAnime {
  subjectId: string;
  slug: string;
  animeTitle: LocalizedText;
  spotCount: number;
}

export interface HomeCatalogLocation {
  slug: string;
  name: LocalizedText;
  spotCount: number;
}

export interface HomeCatalogSource {
  spotCount: number;
  animeCount: number;
  locationCount: number;
  animes: HomeCatalogAnime[];
  locations: HomeCatalogLocation[];
  spots: Iterable<HomeCatalogSpot>;
}

export interface HomeAreaCard {
  slug: string;
  name: string;
  spotCount: number;
  href: string;
  tone: number;
  pins: Array<{ x: number; y: number }>;
}

export interface HomeAnimeCard {
  slug: string;
  title: string;
  spotCount: number;
  areaName: string;
  href: string;
  tone: number;
  glyph: string;
}

export interface HomeAnimeTag {
  slug: string;
  title: string;
  href: string;
}

export interface HomeNearbySeed {
  id: string;
  name: string;
  anime: string;
  lat: number;
  lng: number;
  href: string;
}

export interface HomeCatalog {
  spotCount: number;
  animeCount: number;
  locationCount: number;
  areas: HomeAreaCard[];
  animeCards: HomeAnimeCard[];
  animeTags: HomeAnimeTag[];
  nearby: HomeNearbySeed[];
  popularLocationSlugs: string[];
}

const EMPTY: HomeCatalog = {
  spotCount: 0,
  animeCount: 0,
  locationCount: 0,
  areas: [],
  animeCards: [],
  animeTags: [],
  nearby: [],
  popularLocationSlugs: [],
};

function firstFilled(values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function homeLabel(text: LocalizedText, locale: HomeLocale): string {
  if (locale === "zh-tw") {
    return firstFilled([text.tw, text.ja, text.en]);
  }
  return pickLocalizedText(text, locale);
}

function firstGlyph(title: string): string {
  return Array.from(title.trim())[0] ?? "?";
}

function subjectIdOf(spot: HomeCatalogSpot): string {
  return firstFilled([spot.workSubjectId, spot.subjectId]);
}

function toPins(points: Array<{ lat: number; lng: number }>) {
  const sample = points.slice(0, PIN_LIMIT);
  if (sample.length === 0) return [];
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const point of sample) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (sample.length === 1 || (latSpan < 0.0001 && lngSpan < 0.0001)) {
    return sample.map((_, index) => ({
      x: 38 + (index % 3) * 12,
      y: 34 + Math.floor(index / 3) * 14,
    }));
  }
  return sample.map((point) => ({
    x: 14 + ((point.lng - minLng) / lngSpan) * 72,
    y: 14 + (1 - (point.lat - minLat) / latSpan) * 72,
  }));
}

function countable(spot: HomeCatalogSpot, locale: HomeLocale): boolean {
  if (spot.redirectTo) return false;
  if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return false;
  if (locale === "zh-tw" && !isZhTwCoveredLocationSlug(spot.locationSlug)) {
    return false;
  }
  return true;
}

/** Popular areas and anime from spot counts. Example numbers in the design are not used. */
export function buildHomeCatalog(
  source: HomeCatalogSource | null,
  locale: HomeLocale,
): HomeCatalog {
  if (!source) return EMPTY;
  const spots = [...source.spots];

  const locations =
    locale === "zh-tw"
      ? source.locations.filter((location) =>
          isZhTwCoveredLocationSlug(location.slug),
        )
      : source.locations;
  const areasRanked = [...locations].sort(
    (a, b) => b.spotCount - a.spotCount || a.slug.localeCompare(b.slug),
  );
  const topAreas = areasRanked.slice(0, AREA_LIMIT);
  const areaSet = new Set(topAreas.map((area) => area.slug));
  const locationBySlug = new Map(
    locations.map((location) => [location.slug, location]),
  );

  const animeCounts = new Map<string, number>();
  let coveredSpotCount = 0;
  if (locale === "zh-tw") {
    for (const spot of spots) {
      if (!countable(spot, locale)) continue;
      coveredSpotCount += 1;
      const id = subjectIdOf(spot);
      animeCounts.set(id, (animeCounts.get(id) ?? 0) + 1);
    }
  }

  const rankedAnime = source.animes
    .map((anime) => ({
      anime,
      spotCount:
        locale === "zh-tw"
          ? (animeCounts.get(anime.subjectId) ?? 0)
          : anime.spotCount,
    }))
    .filter((entry) => entry.spotCount > 0)
    .sort(
      (a, b) =>
        b.spotCount - a.spotCount || a.anime.slug.localeCompare(b.anime.slug),
    );
  const shownAnime = rankedAnime.slice(0, ANIME_CARD_LIMIT + ANIME_TAG_LIMIT);
  const animeSet = new Set(shownAnime.map((entry) => entry.anime.subjectId));

  const pinPoints = new Map<string, Array<{ lat: number; lng: number }>>();
  const areaHits = new Map<string, Map<string, number>>();
  const seeds: HomeNearbySeed[] = [];
  const seedSlug = topAreas[0]?.slug;

  for (const spot of spots) {
    if (!countable(spot, locale)) continue;
    if (areaSet.has(spot.locationSlug)) {
      const points = pinPoints.get(spot.locationSlug) ?? [];
      if (points.length < PIN_LIMIT) {
        points.push({ lat: spot.lat, lng: spot.lng });
        pinPoints.set(spot.locationSlug, points);
      }
    }
    const subjectId = subjectIdOf(spot);
    if (animeSet.has(subjectId)) {
      const hits = areaHits.get(subjectId) ?? new Map<string, number>();
      hits.set(spot.locationSlug, (hits.get(spot.locationSlug) ?? 0) + 1);
      areaHits.set(subjectId, hits);
    }
    if (
      seedSlug &&
      spot.locationSlug === seedSlug &&
      seeds.length < SEED_LIMIT
    ) {
      const name = applySpotDisplayName(
        locale,
        spot.id,
        homeLabel(spot.answerName, locale),
      );
      if (!name) continue;
      seeds.push({
        id: spot.id,
        name,
        anime: homeLabel(spot.animeTitle, locale),
        lat: spot.lat,
        lng: spot.lng,
        href: withPilgrimageLocale(
          `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
          locale,
        ),
      });
    }
  }

  const areas: HomeAreaCard[] = topAreas.map((area, index) => ({
    slug: area.slug,
    name: homeLabel(area.name, locale),
    spotCount: area.spotCount,
    href: withPilgrimageLocale(`/pilgrimage/locations/${area.slug}`, locale),
    tone: index % 3,
    pins: toPins(pinPoints.get(area.slug) ?? []),
  }));

  function primaryArea(subjectId: string): string {
    const hits = areaHits.get(subjectId);
    if (!hits) return "";
    let bestSlug = "";
    let bestCount = -1;
    for (const [slug, count] of hits) {
      if (count > bestCount || (count === bestCount && slug < bestSlug)) {
        bestSlug = slug;
        bestCount = count;
      }
    }
    const location = locationBySlug.get(bestSlug);
    return location ? homeLabel(location.name, locale) : "";
  }

  const animeCards: HomeAnimeCard[] = shownAnime
    .slice(0, ANIME_CARD_LIMIT)
    .map((entry, index) => {
      const title = homeLabel(entry.anime.animeTitle, locale);
      return {
        slug: entry.anime.slug,
        title,
        spotCount: entry.spotCount,
        areaName: primaryArea(entry.anime.subjectId),
        href: withPilgrimageLocale(
          `/pilgrimage/anime/${entry.anime.slug}`,
          locale,
        ),
        tone: index % 6,
        glyph: firstGlyph(title),
      };
    });

  const animeTags: HomeAnimeTag[] = shownAnime
    .slice(ANIME_CARD_LIMIT, ANIME_CARD_LIMIT + ANIME_TAG_LIMIT)
    .map((entry) => ({
      slug: entry.anime.slug,
      title: homeLabel(entry.anime.animeTitle, locale),
      href: withPilgrimageLocale(
        `/pilgrimage/anime/${entry.anime.slug}`,
        locale,
      ),
    }));

  const spotCount = locale === "zh-tw" ? coveredSpotCount : source.spotCount;
  const animeCount =
    locale === "zh-tw" ? rankedAnime.length : source.animeCount;
  const locationCount =
    locale === "zh-tw" ? locations.length : source.locationCount;

  return {
    spotCount,
    animeCount,
    locationCount,
    areas,
    animeCards,
    animeTags,
    nearby: seeds,
    popularLocationSlugs: topAreas.map((area) => area.slug),
  };
}
