import type { Map as MapLibreMap } from "maplibre-gl";
import { GoogleMapTilesAttributionControl } from "~/components/map/google-map-tiles-attribution-control";
import type { HomeMapBasemapKind } from "~/lib/home-map-basemap";
import {
  buildGoogleMapTilesMapStyle,
  createGoogleMapTilesSession,
  type GoogleMapTilesLocale,
  type GoogleMapTilesSessionFailure,
} from "~/lib/google-map-tiles-basemap";
import { GOOGLE_MAP_AK } from "~/lib/google-street-view";

export interface ApplyGoogleMapTilesBasemapResult {
  applied: boolean;
  activeBasemap: HomeMapBasemapKind;
  sessionFailure?: GoogleMapTilesSessionFailure;
}

/**
 * Swaps the MapLibre style to Google roadmap raster when a session succeeds.
 * Caller must re-install overlay layers on `onStyleReady`.
 */
export async function applyGoogleMapTilesBasemap(
  map: MapLibreMap,
  locale: GoogleMapTilesLocale,
  onStyleReady: () => void,
  placement: "bottom-left" | "bottom-right" = "bottom-left",
): Promise<ApplyGoogleMapTilesBasemapResult> {
  const apiKey = GOOGLE_MAP_AK;
  if (!apiKey) {
    return { applied: false, activeBasemap: "openfreemap" };
  }

  const sessionResult = await createGoogleMapTilesSession(locale, apiKey);
  if (!sessionResult.ok) {
    return {
      applied: false,
      activeBasemap: "openfreemap",
      sessionFailure: sessionResult,
    };
  }

  const style = buildGoogleMapTilesMapStyle(sessionResult.session, apiKey);

  return await new Promise((resolve) => {
    const finish = (): void => {
      map.addControl(
        new GoogleMapTilesAttributionControl(sessionResult.session, apiKey),
        placement,
      );
      onStyleReady();
      resolve({ applied: true, activeBasemap: "google" });
    };

    void map.once("style.load", finish);
    void map.setStyle(style);
  });
}
