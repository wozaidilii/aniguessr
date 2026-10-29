import type { Map as MapLibreMap } from "maplibre-gl";
import { mountGoogleMapTilesAttribution } from "~/components/map/google-map-tiles-attribution-control";
import type { HomeMapBasemapKind } from "~/lib/home-map-basemap";
import {
  attachGoogleMapTilesQuotaMonitor,
} from "~/lib/google-map-tiles-quota-monitor";
import {
  buildGoogleMapTilesMapStyle,
  createGoogleMapTilesSession,
  type GoogleMapTilesLocale,
  type GoogleMapTilesSessionFailure,
} from "~/lib/google-map-tiles-basemap";
import { resolveGoogleMapTilesApiKey } from "~/lib/google-map-tiles-api-key";
import type { GoogleMapTilesAttributionSurface } from "~/components/map/google-map-tiles-attribution-control";

let loggedCreateSessionFailure = false;

function warnCreateSessionFailureOnce(failure: GoogleMapTilesSessionFailure): void {
  if (loggedCreateSessionFailure) return;
  loggedCreateSessionFailure = true;
  if (typeof console === "undefined") return;
  console.warn(
    "[AniGuessr map] Google Map Tiles unavailable; staying on OpenFreeMap Positron.",
    failure.status ?? "network",
    failure.googleStatus ?? failure.message,
  );
}

/** Test hook: reset single warn guard. */
export function resetGoogleMapTilesBasemapWarnForTests(): void {
  loggedCreateSessionFailure = false;
}

export interface ApplyGoogleMapTilesBasemapResult {
  applied: boolean;
  activeBasemap: HomeMapBasemapKind;
  sessionFailure?: GoogleMapTilesSessionFailure;
}

export interface ApplyGoogleMapTilesBasemapOptions {
  restoreOpenFreeMapAttribution?: () => void;
  onRevertedToOpenFreemap?: () => void;
}

/**
 * Swaps the MapLibre style to Google roadmap raster when a session succeeds.
 * Caller must re-install overlay layers on `onStyleReady`.
 */
export async function applyGoogleMapTilesBasemap(
  map: MapLibreMap,
  locale: GoogleMapTilesLocale,
  onStyleReady: () => void,
  surface: GoogleMapTilesAttributionSurface,
  options?: ApplyGoogleMapTilesBasemapOptions,
): Promise<ApplyGoogleMapTilesBasemapResult & { detachQuotaMonitor?: () => void }> {
  const apiKey = resolveGoogleMapTilesApiKey();
  if (!apiKey) {
    return { applied: false, activeBasemap: "openfreemap" };
  }

  const sessionResult = await createGoogleMapTilesSession(locale, apiKey);
  if (!sessionResult.ok) {
    warnCreateSessionFailureOnce(sessionResult);
    return {
      applied: false,
      activeBasemap: "openfreemap",
      sessionFailure: sessionResult,
    };
  }

  const style = buildGoogleMapTilesMapStyle(sessionResult.session, apiKey);

  return await new Promise((resolve) => {
    const finish = (): void => {
      mountGoogleMapTilesAttribution(
        map,
        sessionResult.session,
        apiKey,
        surface,
      );
      onStyleReady();
      let detachQuotaMonitor: (() => void) | undefined;
      if (options?.restoreOpenFreeMapAttribution && options.onRevertedToOpenFreemap) {
        detachQuotaMonitor = attachGoogleMapTilesQuotaMonitor(map, {
          restoreOpenFreeMapAttribution: options.restoreOpenFreeMapAttribution,
          onReverted: options.onRevertedToOpenFreemap,
        });
      }
      resolve({
        applied: true,
        activeBasemap: "google",
        detachQuotaMonitor,
      });
    };

    void map.once("style.load", finish);
    void map.setStyle(style);
  });
}
