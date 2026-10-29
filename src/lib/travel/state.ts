import { z } from "zod";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import type { TripState } from "./types";

export const TRIP_STORAGE_KEY = "aniguessr_travel_draft_v1";
export const MAX_TRIP_STOPS = 60;
export const MAX_TRIP_JSON = 32_000;
export const MAX_TRIP_HASH = 100_000;
const ids = (max: number) =>
  z
    .array(z.string().min(1).max(180))
    .max(max)
    .transform((items) => [...new Set(items)]);
export const tripStateSchema = z
  .object({
    version: z.literal(1),
    mode: z.enum(["anime", "route"]),
    animeIds: ids(8),
    spotIds: ids(MAX_TRIP_STOPS),
    placeIds: ids(MAX_TRIP_STOPS),
    routeIds: ids(12),
    excludedIds: ids(180),
    stopOrder: ids(180),
    dayBreakBefore: ids(180).default([]),
    days: z.number().int().min(1).max(14),
    pace: z.enum(["relaxed", "balanced", "full"]),
    transport: z.enum(["transit", "walking", "driving"]),
    interests: z.array(z.enum(["sightseeing", "food", "onsen"])).max(3),
    startDate: z
      .string()
      .max(10)
      .refine(
        (date) =>
          date === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(date) &&
            Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
            new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date),
      ),
    radiusKm: z.number().min(1).max(50),
    visitMinutes: z
      .record(z.string().max(180), z.number().int().min(0).max(720))
      .refine((values) => Object.keys(values).length <= 180)
      .default({}),
  })
  .refine((state) => {
    try {
      const raw = JSON.stringify(state);
      return (
        raw.length <= MAX_TRIP_JSON &&
        encodeURIComponent(raw).length + 6 <= MAX_TRIP_HASH
      );
    } catch {
      return false;
    }
  }, "Trip is too large to save and share");

export function emptyTrip(): TripState {
  return {
    version: 1,
    mode: "anime",
    animeIds: [],
    spotIds: [],
    placeIds: [],
    routeIds: [],
    excludedIds: [],
    stopOrder: [],
    dayBreakBefore: [],
    days: 3,
    pace: "balanced",
    transport: "transit",
    interests: ["sightseeing", "food", "onsen"],
    startDate: "",
    radiusKm: 5,
    visitMinutes: {},
  };
}

export function parseTrip(raw: string): TripState | null {
  if (raw.length > MAX_TRIP_JSON) return null;
  try {
    const parsed = tripStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A fragment keeps the full draft out of HTTP requests and canonical URLs. */
export function tripShareUrl(
  origin: string,
  locale: PilgrimageLocale,
  state: TripState,
): string {
  const parsed = tripStateSchema.parse(state);
  return `${origin}/${locale}/pilgrimage/planner#trip=${encodeURIComponent(JSON.stringify(parsed))}`;
}

export function tripFromHash(hash: string): TripState | null {
  if (!hash.startsWith("#trip=") || hash.length > MAX_TRIP_HASH) return null;
  try {
    return parseTrip(decodeURIComponent(hash.slice(6)));
  } catch {
    return null;
  }
}

export function tripDate(
  start: string,
  day: number,
  locale: PilgrimageLocale,
): string {
  if (!start) return "";
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day - 1);
  return new Intl.DateTimeFormat(locale === "zh-tw" ? "zh-TW" : locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}
