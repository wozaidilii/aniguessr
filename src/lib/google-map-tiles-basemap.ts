import type { StyleSpecification } from "maplibre-gl";
import type { HomeLocale } from "~/lib/home-locale";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { resolveGoogleMapTilesApiKey } from "~/lib/google-map-tiles-api-key";

export type GoogleMapTilesLocale = HomeLocale | PilgrimageLocale;

export interface GoogleMapTilesLanguageRegion {
  language: string;
  region: string;
}

const SESSION_CACHE_KEY = "aniguessr.googleMapTilesSession.v2";
const CREATE_SESSION_URL = "https://tile.googleapis.com/v1/createSession";
const TILE_PATH = "https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}";
/** Viewport metadata (copyright) — must use `/tile/v1/viewport`, not `/v1/viewport`. */
export const GOOGLE_MAP_TILES_VIEWPORT_URL =
  "https://tile.googleapis.com/tile/v1/viewport";

/** Self-hosted Google logo (Map Tiles API attribution policies). */
export const GOOGLE_MAP_TILES_LOGO_PATH =
  "/images/maps/google-powered-by-on-white.png";

/** @deprecated Use GOOGLE_MAP_TILES_LOGO_PATH */
export const GOOGLE_MAP_TILES_LOGO_URL = GOOGLE_MAP_TILES_LOGO_PATH;

/** Bump when createSession `styles` change so old cached sessions are not reused. */
export const GOOGLE_MAP_TILES_SESSION_STYLES_VERSION = "poi-labels-hide-v2";

export type GoogleMapTilesStyleRule = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
};

const LABELS_OFF: GoogleMapTilesStyleRule["stylers"] = [
  { visibility: "off" },
];

function hideFeatureLabels(
  featureType: string,
): GoogleMapTilesStyleRule[] {
  return [
    { featureType, elementType: "labels", stylers: LABELS_OFF },
    { featureType, elementType: "labels.icon", stylers: LABELS_OFF },
  ];
}

/** Map Tiles API `styles` (Maps JS styled-map syntax). Roadmap sessions only. */
export function googleMapTilesCreateSessionStyles(): GoogleMapTilesStyleRule[] {
  return [
    ...hideFeatureLabels("poi"),
    ...hideFeatureLabels("landscape.natural"),
  ];
}

export function googleMapTilesSessionCacheStorageKey(): string {
  return SESSION_CACHE_KEY;
}

export function googleMapTilesSessionCacheFingerprint(
  language: string,
  region: string,
): string {
  return `${language}|${region}|${GOOGLE_MAP_TILES_SESSION_STYLES_VERSION}`;
}

interface CachedGoogleMapTilesSession {
  language: string;
  region: string;
  stylesVersion: string;
  session: string;
  expirySec: number;
}

let memoryCachedSession: CachedGoogleMapTilesSession | null = null;

export interface GoogleMapTilesSessionResult {
  ok: true;
  session: string;
  expirySec: number;
  tileWidth: number;
}

export interface GoogleMapTilesSessionFailure {
  ok: false;
  status: number | null;
  message: string;
  googleStatus?: string;
  googleMessage?: string;
}

export type GoogleMapTilesSessionResponse =
  | GoogleMapTilesSessionResult
  | GoogleMapTilesSessionFailure;

export function googleMapTilesLanguageRegion(
  locale: GoogleMapTilesLocale,
): GoogleMapTilesLanguageRegion {
  switch (locale) {
    case "ja":
      return { language: "ja", region: "JP" };
    case "en":
      return { language: "en", region: "JP" };
    case "zh":
      return { language: "zh-CN", region: "JP" };
    case "zh-tw":
      return { language: "zh-TW", region: "JP" };
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}

function parseExpirySec(expiry: unknown): number {
  if (typeof expiry === "number" && Number.isFinite(expiry)) return expiry;
  if (typeof expiry === "string" && expiry.trim()) {
    const parsed = Number(expiry);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function sessionStillValid(
  cached: CachedGoogleMapTilesSession,
  language: string,
  region: string,
  nowSec: number,
): boolean {
  if (cached.language !== language || cached.region !== region) return false;
  if (cached.stylesVersion !== GOOGLE_MAP_TILES_SESSION_STYLES_VERSION) {
    return false;
  }
  if (!cached.session) return false;
  if (!cached.expirySec) return true;
  return cached.expirySec - 60 > nowSec;
}

export function readCachedGoogleMapTilesSession(
  language: string,
  region: string,
  nowSec = Math.floor(Date.now() / 1000),
): string | null {
  if (
    memoryCachedSession &&
    sessionStillValid(memoryCachedSession, language, region, nowSec)
  ) {
    return memoryCachedSession.session;
  }
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedGoogleMapTilesSession;
    if (!sessionStillValid(cached, language, region, nowSec)) return null;
    memoryCachedSession = cached;
    return cached.session;
  } catch {
    return null;
  }
}

export function writeCachedGoogleMapTilesSession(
  language: string,
  region: string,
  session: string,
  expirySec: number,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: CachedGoogleMapTilesSession = {
      language,
      region,
      stylesVersion: GOOGLE_MAP_TILES_SESSION_STYLES_VERSION,
      session,
      expirySec,
    };
    memoryCachedSession = payload;
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    memoryCachedSession = {
      language,
      region,
      stylesVersion: GOOGLE_MAP_TILES_SESSION_STYLES_VERSION,
      session,
      expirySec,
    };
  }
}

export function clearCachedGoogleMapTilesSession(): void {
  memoryCachedSession = null;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    sessionStorage.removeItem("aniguessr.googleMapTilesSession.v1");
  } catch {
    // ignore
  }
}

export interface GoogleMapTilesCreateSessionBody {
  mapType: "roadmap";
  language: string;
  region: string;
  styles: GoogleMapTilesStyleRule[];
}

export function buildGoogleMapTilesCreateSessionBody(
  language: string,
  region: string,
): GoogleMapTilesCreateSessionBody {
  return {
    mapType: "roadmap",
    language,
    region,
    styles: googleMapTilesCreateSessionStyles(),
  };
}

function failureFromResponse(
  status: number,
  body: unknown,
): GoogleMapTilesSessionFailure {
  const record =
    body && typeof body === "object"
      ? (body as { error?: { status?: string; message?: string } })
      : null;
  const googleStatus = record?.error?.status;
  const googleMessage = record?.error?.message;
  const message =
    googleMessage ??
    (typeof body === "string" ? body.slice(0, 240) : `HTTP ${status}`);
  return {
    ok: false,
    status,
    message,
    googleStatus,
    googleMessage,
  };
}

function readStringField(body: unknown, field: string): string {
  if (!body || typeof body !== "object" || !(field in body)) return "";
  const value = (body as Record<string, unknown>)[field];
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Creates a roadmap session (client-side; uses public API key). */
export async function createGoogleMapTilesSession(
  locale: GoogleMapTilesLocale,
  apiKey: string | undefined = resolveGoogleMapTilesApiKey(),
): Promise<GoogleMapTilesSessionResponse> {
  if (!apiKey) {
    return {
      ok: false,
      status: null,
      message: "Google Map Tiles API key is not configured",
    };
  }

  const { language, region } = googleMapTilesLanguageRegion(locale);
  const cached = readCachedGoogleMapTilesSession(language, region);
  if (cached) {
    return { ok: true, session: cached, expirySec: 0, tileWidth: 256 };
  }

  let response: Response;
  try {
    response = await fetch(
      `${CREATE_SESSION_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildGoogleMapTilesCreateSessionBody(language, region),
        ),
      },
    );
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : "Network error",
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return failureFromResponse(response.status, body);
  }

  const session = readStringField(body, "session");
  if (!session) {
    return {
      ok: false,
      status: response.status,
      message: "createSession response missing session",
    };
  }

  const expirySec =
    body && typeof body === "object" && "expiry" in body
      ? parseExpirySec((body as Record<string, unknown>).expiry)
      : 0;
  const tileWidthRaw = readStringField(body, "tileWidth");
  const tileWidth = tileWidthRaw ? Number(tileWidthRaw) : 256;

  writeCachedGoogleMapTilesSession(language, region, session, expirySec);

  return {
    ok: true,
    session,
    expirySec,
    tileWidth: Number.isFinite(tileWidth) ? tileWidth : 256,
  };
}

export function googleMapTilesRasterUrlTemplate(
  session: string,
  apiKey: string,
): string {
  const params = new URLSearchParams({
    session,
    key: apiKey,
  });
  return `${TILE_PATH}?${params.toString()}`;
}

export function googleMapTilesRasterFadeMs(): number {
  if (typeof window === "undefined") return 200;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
}

export function buildGoogleMapTilesMapStyle(
  session: string,
  apiKey: string,
  rasterFadeMs = googleMapTilesRasterFadeMs(),
): StyleSpecification {
  return {
    version: 8,
    sources: {
      "google-roadmap": {
        type: "raster",
        tiles: [googleMapTilesRasterUrlTemplate(session, apiKey)],
        tileSize: 256,
        maxzoom: 22,
      },
    },
    layers: [
      {
        id: "google-roadmap",
        type: "raster",
        source: "google-roadmap",
        paint: {
          "raster-fade-duration": rasterFadeMs,
        },
      },
    ],
  };
}

export interface GoogleMapTilesViewportAttribution {
  copyright: string;
}

export function buildGoogleMapTilesViewportUrl(
  session: string,
  apiKey: string,
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  },
): string {
  const params = new URLSearchParams({
    session,
    key: apiKey,
    zoom: String(Math.round(bounds.zoom)),
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });
  return `${GOOGLE_MAP_TILES_VIEWPORT_URL}?${params.toString()}`;
}

const viewportAttributionInflight = new Map<
  string,
  Promise<GoogleMapTilesViewportAttribution | null>
>();
const viewportAttributionResolved = new Map<
  string,
  GoogleMapTilesViewportAttribution | null
>();

/** Test hook: clear viewport dedupe caches. */
export function resetGoogleMapTilesViewportAttributionCacheForTests(): void {
  viewportAttributionInflight.clear();
  viewportAttributionResolved.clear();
}

/** Dynamic attribution required by Map Tiles API policies. */
export async function fetchGoogleMapTilesViewportAttribution(
  session: string,
  apiKey: string,
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom: number;
  },
): Promise<GoogleMapTilesViewportAttribution | null> {
  const url = buildGoogleMapTilesViewportUrl(session, apiKey, bounds);
  if (viewportAttributionResolved.has(url)) {
    return viewportAttributionResolved.get(url) ?? null;
  }
  const existing = viewportAttributionInflight.get(url);
  if (existing) return existing;

  const request = (async (): Promise<GoogleMapTilesViewportAttribution | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const body = (await response.json()) as { copyright?: string };
      const copyright =
        typeof body.copyright === "string" ? body.copyright.trim() : "";
      return copyright ? { copyright } : null;
    } catch {
      return null;
    } finally {
      viewportAttributionInflight.delete(url);
    }
  })();
  viewportAttributionInflight.set(url, request);
  const result = await request;
  viewportAttributionResolved.set(url, result);
  return result;
}
