import type { StyleSpecification } from "maplibre-gl";
import { buildGoogleMapBasemapPlaceholderStyle } from "~/lib/google-map-basemap-placeholder";
import { resolveGoogleMapTilesApiKey } from "~/lib/google-map-tiles-api-key";
import { isGoogleMapTilesQuotaFallbackActive } from "~/lib/google-map-tiles-quota-fallback";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

export type HomeMapBasemapKind = "google" | "openfreemap";

/** Rollback switch: `openfreemap` keeps Positron only; default is Google when a key exists. */
export function homeMapBasemapMode(): HomeMapBasemapKind {
  const raw = process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
  if (raw === "openfreemap") return "openfreemap";
  return "google";
}

export function homeMapInitialStyleUrl(): string {
  return OPENFREEMAP_POSITRON_STYLE;
}

/** MapLibre style for first paint: placeholder when Google will load, else Positron. */
export function resolveHomeMapInitialStyle(): StyleSpecification | string {
  if (shouldAttemptGoogleMapTilesBasemap()) {
    return buildGoogleMapBasemapPlaceholderStyle();
  }
  return homeMapInitialStyleUrl();
}

/** True when we should try Map Tiles API (still falls back to Positron on failure). */
export function shouldAttemptGoogleMapTilesBasemap(): boolean {
  if (homeMapBasemapMode() === "openfreemap") return false;
  if (isGoogleMapTilesQuotaFallbackActive()) return false;
  return Boolean(resolveGoogleMapTilesApiKey());
}

export function shouldTuneOpenFreemapPlaceLabels(
  activeBasemap: HomeMapBasemapKind,
): boolean {
  return activeBasemap === "openfreemap";
}
