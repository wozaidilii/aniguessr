import type { Map as MapLibreMap } from "maplibre-gl";
import { mountGoogleMapTilesAttribution } from "~/components/map/google-map-tiles-attribution-control";
import {
  fadeInGoogleMapBasemapCanvas,
  googleMapBasemapFadeMs,
} from "~/lib/google-map-basemap-placeholder";
import type { HomeMapBasemapKind } from "~/lib/home-map-basemap";
import { homeMapInitialStyleUrl } from "~/lib/home-map-basemap";
import {
  attachGoogleMapTilesQuotaMonitor,
} from "~/lib/google-map-tiles-quota-monitor";
import {
  buildGoogleMapTilesMapStyle,
  createGoogleMapTilesSession,
  type GoogleMapTilesLocale,
  type GoogleMapTilesSessionFailure,
  type GoogleMapTilesSessionResponse,
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
  /** When set, skips an extra createSession round-trip (started before map init). */
  sessionPromise?: Promise<GoogleMapTilesSessionResponse>;
  onGoogleBasemapVisible?: () => void;
  onFallbackToOpenFreemap?: () => void;
}

function applyPositronFallback(
  map: MapLibreMap,
  onStyleReady: () => void,
  options?: ApplyGoogleMapTilesBasemapOptions,
): Promise<ApplyGoogleMapTilesBasemapResult> {
  return new Promise((resolve) => {
    const finish = (): void => {
      options?.onFallbackToOpenFreemap?.();
      onStyleReady();
      resolve({ applied: false, activeBasemap: "openfreemap" });
    };
    void map.once("style.load", finish);
    void map.setStyle(homeMapInitialStyleUrl());
  });
}

/**
 * Loads Google roadmap raster when a session succeeds.
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
    return applyPositronFallback(map, onStyleReady, options);
  }

  const sessionResult = await (options?.sessionPromise ??
    createGoogleMapTilesSession(locale, apiKey));
  if (!sessionResult.ok) {
    warnCreateSessionFailureOnce(sessionResult);
    return {
      ...(await applyPositronFallback(map, onStyleReady, options)),
      sessionFailure: sessionResult,
    };
  }

  const style = buildGoogleMapTilesMapStyle(sessionResult.session, apiKey);

  return await new Promise((resolve) => {
    const finishAfterTiles = (): void => {
      mountGoogleMapTilesAttribution(
        map,
        sessionResult.session,
        apiKey,
        surface,
      );
      options?.onGoogleBasemapVisible?.();
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

    void map.once("style.load", () => {
      fadeInGoogleMapBasemapCanvas(map, googleMapBasemapFadeMs());
      void map.once("idle", finishAfterTiles);
    });
    void map.setStyle(style);
  });
}
