import "server-only";

import type { OgCard, OgNames } from "~/lib/og/card";
import {
  buildAreaCard,
  buildHomeCard,
  buildSpotCard,
  buildWorkCard,
} from "~/lib/og/card";
import { kantoBoundsContain } from "~/lib/home-map-bounds";
import {
  haversineMeters,
  otherWorkCounts,
  type LatLng,
  type MapArt,
} from "~/lib/og/map";
import { isPilgrimageLocale, type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { animeSlugMatches } from "~/lib/pilgrimage-slug";
import {
  getAnimeBySlug,
  getPilgrimageSeoIndex,
  getSpotById,
  listSpotsForAnime,
  listSpotsForLocation,
  resolveLocationSlug,
  type PilgrimageAnimeSummary,
  type PilgrimageLocationSummary,
  type PilgrimageSpot,
} from "~/server/data/pilgrimage-seo";

export type OgLoad =
  | { status: "ready"; card: OgCard; id: string }
  | { status: "redirect"; id: string }
  | { status: "missing" };

interface PlaceSpot {
  id: string;
  lat: number;
  lng: number;
  workId: string;
  locationSlug: string;
}

let placeSpots: PlaceSpot[] | null = null;
let otherWorkCountCache: Map<string, number> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function namesOf(text: unknown): OgNames {
  if (!isRecord(text)) return { ja: "", zh: "", "zh-tw": "", en: "" };
  return {
    ja: textField(text, "ja"),
    zh: textField(text, "zh"),
    "zh-tw": textField(text, "tw"),
    en: textField(text, "en"),
  };
}

/**
 * Anime titles store a Japanese string in `tw` when no official Traditional
 * title exists (`twSource: "ja-fallback"`). Treat that as empty so the card
 * falls through zh-tw → zh → ja instead of painting Japanese as Traditional.
 * Page titles still read `tw` and are unchanged.
 */
function animeNames(text: unknown): OgNames {
  const names = namesOf(text);
  if (isRecord(text) && text.twSource === "ja-fallback") names["zh-tw"] = "";
  return names;
}

function optionalNames(record: object, key: string): OgNames | undefined {
  if (!isRecord(record)) return undefined;
  const names = namesOf(record[key]);
  if (!names.ja && !names.zh && !names.en && !names["zh-tw"]) return undefined;
  return names;
}

function primaryWorkId(spot: { workSubjectId?: string | null; subjectId: string }): string {
  const workId = spot.workSubjectId?.trim();
  if (workId) return workId;
  return spot.subjectId;
}

function coastalFlag(record: object | null | undefined): boolean {
  return isRecord(record) && record.isCoastal === true;
}

function artFor(coastal: boolean): MapArt {
  return coastal ? "coast" : "city";
}

function indexPlaces(): { spots: PlaceSpot[]; others: Map<string, number> } | null {
  const index = getPilgrimageSeoIndex();
  if (!index) return null;
  if (placeSpots && otherWorkCountCache) {
    return { spots: placeSpots, others: otherWorkCountCache };
  }
  const spots: PlaceSpot[] = [];
  for (const id of index.spotIds) {
    const spot = index.spots[id];
    if (!spot || spot.redirectTo) continue;
    if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) continue;
    spots.push({
      id: spot.id,
      lat: spot.lat,
      lng: spot.lng,
      workId: primaryWorkId(spot),
      locationSlug: spot.locationSlug,
    });
  }
  placeSpots = spots;
  otherWorkCountCache = otherWorkCounts(spots);
  return { spots, others: otherWorkCountCache };
}

function locationBySlug(slug: string): PilgrimageLocationSummary | null {
  return (
    getPilgrimageSeoIndex()?.locations.find((location) => location.slug === slug) ??
    null
  );
}

function nearbyPoints(origin: PlaceSpot, spots: PlaceSpot[]): LatLng[] {
  const points: Array<LatLng & { distance: number }> = [];
  for (const spot of spots) {
    if (spot.id === origin.id) continue;
    const distance = haversineMeters(origin, spot);
    if (distance > 3000) continue;
    points.push({ lat: spot.lat, lng: spot.lng, distance });
  }
  points.sort((a, b) => a.distance - b.distance);
  return points.slice(0, 24).map((point) => ({ lat: point.lat, lng: point.lng }));
}

function spotCard(locale: PilgrimageLocale, spot: PilgrimageSpot): OgCard | null {
  const places = indexPlaces();
  if (!places) return null;
  const origin = places.spots.find((item) => item.id === spot.id) ?? {
    id: spot.id,
    lat: spot.lat,
    lng: spot.lng,
    workId: primaryWorkId(spot),
    locationSlug: spot.locationSlug,
  };
  const index = getPilgrimageSeoIndex();
  const workId = primaryWorkId(spot);
  const anime = index?.animes.find((item) => item.subjectId === workId);
  const location = locationBySlug(spot.locationSlug);
  return buildSpotCard({
    requestedLocale: locale,
    spotName: namesOf(spot.answerName),
    ogTitle: optionalNames(spot, "ogTitle"),
    shortName: optionalNames(spot, "shortName"),
    workTitle: animeNames(anime?.animeTitle ?? spot.animeTitle),
    derivedJa: namesOf(spot.title).ja,
    workOgTitle: anime ? optionalNames(anime, "ogTitle") : undefined,
    workShortName: anime ? optionalNames(anime, "shortName") : undefined,
    areaName: namesOf(location?.name ?? spot.location),
    areaOgTitle: location ? optionalNames(location, "ogTitle") : undefined,
    areaShortName: location ? optionalNames(location, "shortName") : undefined,
    otherWorkCount: places.others.get(spot.id) ?? 0,
    art: artFor(coastalFlag(location)),
    origin: { lat: spot.lat, lng: spot.lng },
    nearby: nearbyPoints(origin, places.spots),
  });
}

export function loadSpotOg(locale: PilgrimageLocale, id: string): OgLoad {
  const spot = getSpotById(id);
  if (!spot) return { status: "missing" };
  if (spot.redirectTo && spot.redirectTo !== spot.id) {
    return { status: "redirect", id: spot.redirectTo };
  }
  const card = spotCard(locale, spot);
  if (!card) return { status: "missing" };
  return { status: "ready", card, id: spot.id };
}

function areaNamesFor(spots: PilgrimageSpot[]): OgNames[] {
  const counts = new Map<string, { names: OgNames; count: number }>();
  for (const spot of spots) {
    const current = counts.get(spot.locationSlug);
    if (current) current.count += 1;
    else counts.set(spot.locationSlug, { names: namesOf(spot.location), count: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((item) => item.names);
}

function topLocationArt(spots: PilgrimageSpot[]): MapArt {
  const counts = new Map<string, number>();
  for (const spot of spots) {
    counts.set(spot.locationSlug, (counts.get(spot.locationSlug) ?? 0) + 1);
  }
  let best = "";
  let bestCount = -1;
  for (const [slug, count] of counts) {
    if (count > bestCount) {
      best = slug;
      bestCount = count;
    }
  }
  return artFor(coastalFlag(best ? locationBySlug(best) : null));
}

export function loadAnimeOg(locale: PilgrimageLocale, slug: string): OgLoad {
  const anime = getAnimeBySlug(slug);
  if (!anime) return { status: "missing" };
  if (!animeSlugMatches(slug, anime.slug)) {
    return { status: "redirect", id: anime.slug };
  }
  const card = animeCard(locale, anime);
  if (!card) return { status: "missing" };
  return { status: "ready", card, id: anime.slug };
}

function animeCard(
  locale: PilgrimageLocale,
  anime: PilgrimageAnimeSummary,
): OgCard | null {
  if (!getPilgrimageSeoIndex()) return null;
  const spots = listSpotsForAnime(anime.subjectId);
  return buildWorkCard({
    requestedLocale: locale,
    title: animeNames(anime.animeTitle),
    ogTitle: optionalNames(anime, "ogTitle"),
    shortName: optionalNames(anime, "shortName"),
    spotCount: anime.spotCount,
    areas: areaNamesFor(spots),
    points: spots.map((spot) => ({ lat: spot.lat, lng: spot.lng })),
    art: topLocationArt(spots),
  });
}

function workNamesFor(spots: PilgrimageSpot[]): OgNames[] {
  const index = getPilgrimageSeoIndex();
  const counts = new Map<string, { names: OgNames; count: number }>();
  for (const spot of spots) {
    const workId = primaryWorkId(spot);
    const current = counts.get(workId);
    if (current) {
      current.count += 1;
      continue;
    }
    const anime = index?.animes.find((item) => item.subjectId === workId);
    counts.set(workId, {
      names: animeNames(anime?.animeTitle ?? spot.animeTitle),
      count: 1,
    });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((item) => item.names);
}

export function loadLocationOg(locale: PilgrimageLocale, slug: string): OgLoad {
  const resolved = resolveLocationSlug(slug);
  if (!resolved) return { status: "missing" };
  if (resolved.redirect) return { status: "redirect", id: resolved.location.slug };
  const location = resolved.location;
  const spots = listSpotsForLocation(location.slug);
  const card = buildAreaCard({
    requestedLocale: locale,
    title: namesOf(location.name),
    ogTitle: optionalNames(location, "ogTitle"),
    shortName: optionalNames(location, "shortName"),
    workCount: location.animeCount,
    spotCount: location.spotCount,
    works: workNamesFor(spots),
    points: spots.map((spot) => ({ lat: spot.lat, lng: spot.lng })),
    art: artFor(coastalFlag(location)),
  });
  return { status: "ready", card, id: location.slug };
}

const HOME_POINT_CAP = 80;

function homeMapPoints(): LatLng[] {
  const index = getPilgrimageSeoIndex();
  const sampled: LatLng[] = [];
  if (!index) return sampled;
  for (const id of index.spotIds) {
    const spot = index.spots[id];
    if (!spot || spot.redirectTo) continue;
    if (!kantoBoundsContain(spot.lng, spot.lat)) continue;
    sampled.push({ lat: spot.lat, lng: spot.lng });
    if (sampled.length >= HOME_POINT_CAP) break;
  }
  return sampled;
}

export function loadHomeOg(locale: PilgrimageLocale): OgLoad {
  const index = getPilgrimageSeoIndex();
  const card = buildHomeCard({
    requestedLocale: locale,
    spotCount: index?.spotCount ?? 0,
    points: homeMapPoints(),
  });
  return { status: "ready", card, id: "home" };
}

export function parseOgLocale(value: string): PilgrimageLocale | null {
  return isPilgrimageLocale(value) ? value : null;
}
