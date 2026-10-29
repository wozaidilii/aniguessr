import type { Map as MapLibreMap } from "maplibre-gl";
import { mountGoogleMapTilesAttribution } from "~/components/map/google-map-tiles-attribution-control";
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
import { whenGoogleRoadmapTilesVisible } from "~/lib/google-map-tiles-visible";
import { swapMapStyleUrl } from "~/lib/map-style-swap";

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
  onStyleReady: (activeBasemap: HomeMapBasemapKind) => void,
  options?: ApplyGoogleMapTilesBasemapOptions,
): Promise<ApplyGoogleMapTilesBasemapResult> {
  return new Promise((resolve) => {
    swapMapStyleUrl(map, homeMapInitialStyleUrl(), () => {
      options?.onFallbackToOpenFreemap?.();
      onStyleReady("openfreemap");
      resolve({ applied: false, activeBasemap: "openfreemap" });
    });
  });
}

/**
 * Loads Google roadmap raster when a session succeeds.
 * Caller must re-install overlay layers on `onStyleReady`.
 */
export async function applyGoogleMapTilesBasemap(
  map: MapLibreMap,
  locale: GoogleMapTilesLocale,
  onStyleReady: (activeBasemap: HomeMapBasemapKind) => void,
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
    let detachQuotaMonitor: (() => void) | undefined;

    const finishAfterTiles = (): void => {
      mountGoogleMapTilesAttribution(
        map,
        sessionResult.session,
        apiKey,
        surface,
      );
      options?.onGoogleBasemapVisible?.();
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
      onStyleReady("google");
      whenGoogleRoadmapTilesVisible(map, finishAfterTiles);
    });
    void map.setStyle(style, { diff: false });
  });
}
