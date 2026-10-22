import type { ForeignCountryConfig, LatLng } from "~/lib/foreign-map";
import type {
  GoogleLatLngBoundsInstance,
  GoogleMapInstance,
  GoogleMapPadding,
  GoogleMapsApi,
} from "~/lib/google-street-view";

/**
 * Inset for the round-result fit. Right, bottom, and left keep the pins off
 * the fullscreen control, the camera control, and the Google attribution.
 * Top has to clear the legend (it ends about 52px down) and the marker drawn
 * above that coordinate. The taller answer pin is 54px, plus an 8px gap.
 */
export const ROUND_RESULT_FIT_BOUNDS_PADDING: GoogleMapPadding = {
  top: 114,
  right: 64,
  bottom: 40,
  left: 24,
};

/**
 * Minimum lat/lng span for a result fit. Identical or very close points
 * otherwise collapse to a single-point bounds and fitBounds zooms to the max.
 * 0.002° is about 220m of latitude.
 */
export const MIN_RESULT_BOUNDS_SPAN_DEG = 0.002;

interface GoogleGuessMapView {
  center: LatLng;
  zoom: number;
}

interface SyncGoogleGuessMapViewportOptions {
  map: GoogleMapInstance;
  api: Pick<GoogleMapsApi, "LatLngBounds">;
  country: ForeignCountryConfig;
  restrictToCountry: boolean;
  guess: LatLng | null;
  answer: LatLng | null;
  boundsPadding?: GoogleMapPadding;
}

function resultFitPoints(guess: LatLng, answer: LatLng): [LatLng, LatLng] {
  const latSpan = Math.abs(guess.lat - answer.lat);
  const lngSpan = Math.abs(guess.lng - answer.lng);
  if (
    latSpan >= MIN_RESULT_BOUNDS_SPAN_DEG &&
    lngSpan >= MIN_RESULT_BOUNDS_SPAN_DEG
  ) {
    return [guess, answer];
  }

  const midLat = (guess.lat + answer.lat) / 2;
  const midLng = (guess.lng + answer.lng) / 2;
  const halfLat = Math.max(latSpan, MIN_RESULT_BOUNDS_SPAN_DEG) / 2;
  const halfLng = Math.max(lngSpan, MIN_RESULT_BOUNDS_SPAN_DEG) / 2;
  return [
    { lat: midLat - halfLat, lng: midLng - halfLng },
    { lat: midLat + halfLat, lng: midLng + halfLng },
  ];
}

export function getGoogleGuessMapInitialView(
  country: ForeignCountryConfig,
  restrictToCountry: boolean,
): GoogleGuessMapView {
  return {
    center: restrictToCountry ? country.center : { lat: 20, lng: 0 },
    zoom: restrictToCountry ? country.zoom : 2,
  };
}

export function resetGoogleGuessMapView(
  map: GoogleMapInstance,
  country: ForeignCountryConfig,
  restrictToCountry: boolean,
) {
  const initialView = getGoogleGuessMapInitialView(country, restrictToCountry);
  map.setCenter?.(initialView.center);
  if (!map.setCenter) map.panTo?.(initialView.center);
  map.setZoom?.(initialView.zoom);
}

export function syncGoogleGuessMapViewport({
  map,
  api,
  country,
  restrictToCountry,
  guess,
  answer,
  boundsPadding,
}: SyncGoogleGuessMapViewportOptions) {
  if (guess && answer) {
    const bounds: GoogleLatLngBoundsInstance = new api.LatLngBounds();
    const [first, second] = resultFitPoints(guess, answer);
    bounds.extend(first);
    bounds.extend(second);
    if (boundsPadding) {
      map.fitBounds(bounds, boundsPadding);
    } else {
      map.fitBounds(bounds);
    }
    return;
  }

  if (answer) {
    map.panTo?.(answer);
    map.setZoom?.(9);
    return;
  }

  if (!guess) {
    resetGoogleGuessMapView(map, country, restrictToCountry);
  }
}
