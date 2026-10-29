import {
  haversineKm,
  type NavCatalog,
  type NavSpot,
} from "~/lib/pilgrimage-nav";
import { TRAVEL_HUBS, TRAVEL_PLACES } from "./catalog";
import { POPULAR_ANIME_SUBJECT_IDS } from "~/lib/popular-anime";
import type {
  Coordinate,
  RouteCandidate,
  TripDay,
  TripPlan,
  TripState,
  TripStop,
  TravelMode,
  TravelPlace,
  TravelPace,
} from "./types";

export const DAY_BUDGET: Record<TravelPace, number> = {
  relaxed: 300,
  balanced: 420,
  full: 540,
};
export const MAX_AUTO_PER_ANIME = 6;
const EARTH_KM = 6371;
const rad = (value: number) => (value * Math.PI) / 180;
export const distanceKm = (a: Coordinate, b: Coordinate) =>
  haversineKm(a.lat, a.lng, b.lat, b.lng);
export function validCoordinate(point: Coordinate): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}
export function spotStop(spot: NavSpot): TripStop {
  return {
    ...spot,
    id: `spot:${spot.id}`,
    spotId: spot.id,
    kind: "anime",
    minutes: 40,
  };
}
export function placeStop(place: TravelPlace): TripStop {
  return {
    ...place,
    id: `${place.kind === "hub" ? "hub" : "place"}:${place.id}`,
  };
}

function bearing(a: Coordinate, b: Coordinate): number {
  const delta = rad(b.lng - a.lng);
  return Math.atan2(
    Math.sin(delta) * Math.cos(rad(b.lat)),
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
      Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(delta),
  );
}

/** Great-circle corridor, including endpoints; NOT a road or rail router. */
export function distanceToSegment(
  point: Coordinate,
  a: Coordinate,
  b: Coordinate,
): { distanceKm: number; progressKm: number } {
  const length = distanceKm(a, b);
  if (length < 0.001)
    return { distanceKm: distanceKm(point, a), progressKm: 0 };
  const angle = distanceKm(a, point) / EARTH_KM;
  const delta = bearing(a, point) - bearing(a, b);
  const along =
    Math.atan2(Math.sin(angle) * Math.cos(delta), Math.cos(angle)) * EARTH_KM;
  if (along <= 0) return { distanceKm: distanceKm(point, a), progressKm: 0 };
  if (along >= length)
    return { distanceKm: distanceKm(point, b), progressKm: length };
  return {
    distanceKm:
      Math.abs(
        Math.asin(Math.max(-1, Math.min(1, Math.sin(angle) * Math.sin(delta)))),
      ) * EARTH_KM,
    progressKm: along,
  };
}

export function routeProximity(
  point: Coordinate,
  route: readonly Coordinate[],
): { distanceKm: number; progressKm: number } {
  const first = route[0];
  if (!first) return { distanceKm: Infinity, progressKm: 0 };
  if (route.length === 1)
    return { distanceKm: distanceKm(point, first), progressKm: 0 };
  let best = { distanceKm: Infinity, progressKm: 0 };
  let offset = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!;
    const b = route[i]!;
    const current = distanceToSegment(point, a, b);
    if (current.distanceKm < best.distanceKm)
      best = {
        distanceKm: current.distanceKm,
        progressKm: offset + current.progressKm,
      };
    offset += distanceKm(a, b);
  }
  return best;
}

/** Conservative planning allowances, including a transfer buffer. Not timetable data. */
export function estimateTravelMinutes(km: number, mode: TravelMode): number {
  if (km < 0.1) return 0;
  const minutes =
    mode === "walking"
      ? ((km * 1.3) / 4) * 60
      : mode === "driving"
        ? ((km * 1.35) / (km > 50 ? 60 : 25)) * 60 + 10
        : km < 1
          ? ((km * 1.3) / 4) * 60
          : ((km * 1.3) / (km > 80 ? 65 : 22)) * 60 + 20;
  return Math.ceil(minutes / 5) * 5;
}

function nearestOrder(stops: TripStop[]): TripStop[] {
  const remaining = [...stops];
  const first = remaining.shift();
  if (!first) return [];
  const result = [first];
  while (remaining.length) {
    const last = result[result.length - 1]!;
    let index = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (distanceKm(last, remaining[i]!) < distanceKm(last, remaining[index]!))
        index = i;
    }
    result.push(remaining.splice(index, 1)[0]!);
  }
  return result;
}

/** Inserts detours between fixed route anchors, never reorders those anchors. */
function alongRouteOrder(anchors: TripStop[], extras: TripStop[]): TripStop[] {
  if (!anchors.length) return nearestOrder(extras);
  if (anchors.length === 1) return nearestOrder([anchors[0]!, ...extras]);
  const positions = new Map<string, number>();
  let total = 0;
  anchors.forEach((anchor, i) => {
    if (i) total += distanceKm(anchors[i - 1]!, anchor);
    positions.set(anchor.id, total);
  });
  const ranked = extras.map((stop) => ({
    stop,
    ...routeProximity(stop, anchors),
  }));
  // Stable tie ordering keeps the first anchor first and final anchor last.
  return [
    { stop: anchors[0]!, progressKm: -0.001 },
    ...anchors
      .slice(1, -1)
      .map((stop) => ({ stop, progressKm: positions.get(stop.id)! })),
    ...ranked,
    { stop: anchors[anchors.length - 1]!, progressKm: total + 0.001 },
  ]
    .sort((a, b) => a.progressKm - b.progressKm)
    .map(({ stop }) => stop);
}

export function scheduleStops(
  ordered: TripStop[],
  state: Pick<TripState, "days" | "pace" | "transport">,
): { days: TripDay[]; unscheduled: TripStop[] } {
  const budget = DAY_BUDGET[state.pace];
  const days: TripDay[] = Array.from({ length: state.days }, (_, i) => ({
    day: i + 1,
    stops: [],
    minutes: 0,
    distanceKm: 0,
    overBudget: false,
  }));
  const unscheduled: TripStop[] = [];
  let dayIndex = 0;
  let previous: TripStop | undefined;
  for (const stop of ordered) {
    const km = previous ? distanceKm(previous, stop) : 0;
    const travelMinutes = estimateTravelMinutes(km, state.transport);
    let day = days[dayIndex];
    if (!day) {
      unscheduled.push(stop);
      continue;
    }
    // Reserve one hour for lunch/rest on any day with visits.
    if (
      day.stops.length &&
      day.minutes + travelMinutes + stop.minutes > budget
    ) {
      dayIndex++;
      day = days[dayIndex];
    }
    if (!day) {
      unscheduled.push(stop);
      continue;
    }
    const rest = day.stops.length === 0 ? 60 : 0;
    const elapsed = day.minutes;
    // The reserved break is placed before a stop that crosses noon.
    const priorVisits = day.stops.reduce(
      (sum, item) => sum + item.stop.minutes + item.travelMinutes,
      0,
    );
    const breakBefore = priorVisits >= 180 ? 60 : 0;
    const arrivalMinutes = 540 + priorVisits + breakBefore + travelMinutes;
    day.stops.push({
      stop,
      from: previous,
      distanceKm: km,
      travelMinutes,
      arrivalMinutes,
      departureMinutes: arrivalMinutes + stop.minutes,
    });
    day.minutes = elapsed + travelMinutes + stop.minutes + rest;
    day.distanceKm += km;
    day.overBudget = day.minutes > budget;
    previous = stop;
  }
  return { days, unscheduled };
}

export function buildTripPlan(catalog: NavCatalog, state: TripState): TripPlan {
  const spots = catalog.spots.filter(validCoordinate);
  const lookup = new Map<string, TripStop>([
    ...spots.map((spot) => {
      const stop = spotStop(spot);
      return [stop.id, stop] as const;
    }),
    ...[...TRAVEL_HUBS, ...TRAVEL_PLACES].map((place) => {
      const stop = placeStop(place);
      return [stop.id, stop] as const;
    }),
  ]);
  const excluded = new Set(state.excludedIds);
  const unknownIds: string[] = [];
  const resolve = (id: string) => {
    const stop = lookup.get(id);
    if (!stop) unknownIds.push(id);
    return stop;
  };
  const anchors = state.routeIds
    .map(resolve)
    .filter((stop): stop is TripStop => !!stop);
  const chosen = new Map<string, TripStop>();
  for (const id of [
    ...state.spotIds.map((id) => `spot:${id}`),
    ...state.placeIds.map((id) => `place:${id}`),
  ]) {
    const stop = resolve(id);
    if (stop && !excluded.has(id)) chosen.set(id, stop);
  }
  let omittedAnimeSpots = 0;
  for (const id of state.animeIds) {
    if (!catalog.animes[id]) unknownIds.push(id);
    if (state.mode !== "anime") continue;
    const candidates = spots.filter(
      (spot) => spot.subjectId === id && !excluded.has(`spot:${spot.id}`),
    );
    // Start in the densest municipality; avoid choosing a remote outlier just because it comes first in source data.
    const counts = new Map<string, number>();
    candidates.forEach((spot) =>
      counts.set(spot.locationSlug, (counts.get(spot.locationSlug) ?? 0) + 1),
    );
    const origin = anchors[0] ?? chosen.values().next().value;
    candidates.sort((a, b) =>
      origin
        ? distanceKm(a, origin) - distanceKm(b, origin)
        : (counts.get(b.locationSlug) ?? 0) -
            (counts.get(a.locationSlug) ?? 0) || a.id.localeCompare(b.id),
    );
    const selected: NavSpot[] = [];
    for (const candidate of candidates) {
      if (selected.length >= MAX_AUTO_PER_ANIME) break;
      if (chosen.has(`spot:${candidate.id}`)) continue;
      // Nearby frames of one anime are one optional visit; explicit choices are never collapsed.
      if (selected.some((other) => distanceKm(other, candidate) < 0.15))
        continue;
      selected.push(candidate);
      const stop = spotStop(candidate);
      chosen.set(stop.id, stop);
    }
    omittedAnimeSpots += candidates.filter(
      (spot) => !chosen.has(`spot:${spot.id}`),
    ).length;
  }
  for (const anchor of anchors) chosen.delete(anchor.id);
  let ordered =
    state.mode === "route" || anchors.length
      ? alongRouteOrder(anchors, [...chosen.values()])
      : nearestOrder([...chosen.values()]);
  if (state.stopOrder.length && state.mode === "anime") {
    const positions = new Map(state.stopOrder.map((id, i) => [id, i]));
    ordered = ordered.sort(
      (a, b) =>
        (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity),
    );
  }
  ordered = ordered.map((stop) => ({
    ...stop,
    minutes: state.visitMinutes[stop.id] ?? stop.minutes,
  }));
  const included = new Set(ordered.map((stop) => stop.id));
  const route = state.mode === "route" ? anchors : ordered;
  const discoveries = spots
    .filter(
      (spot) =>
        !included.has(`spot:${spot.id}`) &&
        !excluded.has(`spot:${spot.id}`) &&
        (!state.animeIds.length || state.animeIds.includes(spot.subjectId)),
    )
    .map((spot) => ({ stop: spotStop(spot), ...routeProximity(spot, route) }))
    .filter((item) => item.distanceKm <= state.radiusKm)
    .sort(
      (a, b) =>
        Number(
          POPULAR_ANIME_SUBJECT_IDS.some((id) => id === b.stop.subjectId),
        ) -
          Number(
            POPULAR_ANIME_SUBJECT_IDS.some((id) => id === a.stop.subjectId),
          ) ||
        a.distanceKm - b.distanceKm ||
        a.progressKm - b.progressKm,
    );
  // Diversify discoveries: one frame per work per ~150 m, retain distinct works at the same place.
  const diverse: RouteCandidate[] = [];
  for (const candidate of discoveries) {
    if (
      !diverse.some(
        (other) =>
          other.stop.subjectId === candidate.stop.subjectId &&
          distanceKm(other.stop, candidate.stop) < 0.15,
      )
    )
      diverse.push(candidate);
    if (diverse.length === 40) break;
  }
  const nearby = TRAVEL_PLACES.filter(
    (place) =>
      place.kind !== "hub" &&
      state.interests.includes(place.kind) &&
      !included.has(`place:${place.id}`) &&
      !excluded.has(`place:${place.id}`),
  )
    .map((place) => ({
      stop: placeStop(place),
      ...routeProximity(place, route),
    }))
    .filter((item) => item.distanceKm <= state.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  const schedule = scheduleStops(ordered, state);
  return {
    ordered,
    ...schedule,
    discoveries: diverse,
    nearby,
    unknownIds,
    omittedAnimeSpots,
    longTransfers: ordered.filter(
      (stop, i) =>
        i > 0 &&
        estimateTravelMinutes(
          distanceKm(ordered[i - 1]!, stop),
          state.transport,
        ) > 180,
    ).length,
  };
}

export function legDirectionsUrl(
  from: Coordinate | undefined,
  to: Coordinate,
  mode: TravelMode,
): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (from) url.searchParams.set("origin", `${from.lat},${from.lng}`);
  url.searchParams.set("destination", `${to.lat},${to.lng}`);
  url.searchParams.set("travelmode", mode);
  return url.toString();
}

export function nearbySearchUrl(point: Coordinate, query: string): string {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set(
    "query",
    `${query} near ${point.lat.toFixed(5)},${point.lng.toFixed(5)}`,
  );
  return url.toString();
}
