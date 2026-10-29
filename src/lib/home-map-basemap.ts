import { resolveGoogleMapTilesApiKey } from "~/lib/google-map-tiles-api-key";
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

/** True when we should try Map Tiles API (still falls back to Positron on failure). */
export function shouldAttemptGoogleMapTilesBasemap(): boolean {
  if (homeMapBasemapMode() === "openfreemap") return false;
  return Boolean(resolveGoogleMapTilesApiKey());
}

export function shouldTuneOpenFreemapPlaceLabels(
  activeBasemap: HomeMapBasemapKind,
): boolean {
  return activeBasemap === "openfreemap";
}
