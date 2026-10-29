import type {
  ErrorEvent,
  Map as MapLibreMap,
  MapSourceDataEvent,
} from "maplibre-gl";
import { detachGoogleMapTilesAttribution } from "~/components/map/google-map-tiles-attribution-control";
import { homeMapInitialStyleUrl } from "~/lib/home-map-basemap";
import {
  createGoogleTileLoadCounters,
  isGoogleRoadmapTileErrorMessage,
  markGoogleMapTilesQuotaFallbackActive,
  recordGoogleTileLoadFailure,
  recordGoogleTileLoadSuccess,
  type GoogleTileLoadCounters,
} from "~/lib/google-map-tiles-quota-fallback";

let loggedTileQuotaFallback = false;

export function resetGoogleMapTilesTileQuotaWarnForTests(): void {
  loggedTileQuotaFallback = false;
}

function warnGoogleTileQuotaFallbackOnce(): void {
  if (loggedTileQuotaFallback) return;
  loggedTileQuotaFallback = true;
  if (typeof console === "undefined") return;
  console.warn(
    "[AniGuessr map] Google 2D map tiles unavailable (quota or errors); using OpenFreeMap Positron for this tab.",
  );
}

export interface GoogleMapTilesQuotaMonitorCallbacks {
  onReverted: () => void;
  restoreOpenFreeMapAttribution: () => void;
}

type MapLibreErrorEventWithMeta = ErrorEvent & {
  sourceId?: string;
};

function isGoogleRoadmapMapError(event: ErrorEvent): boolean {
  const meta = event as MapLibreErrorEventWithMeta;
  if (meta.sourceId === "google-roadmap") return true;
  let message = "";
  if (event.error instanceof Error) {
    message = event.error.message;
  } else if (typeof event.error === "string") {
    message = event.error;
  }
  return isGoogleRoadmapTileErrorMessage(message);
}

function isGoogleRoadmapTileLoaded(event: MapSourceDataEvent): boolean {
  return (
    event.sourceId === "google-roadmap" &&
    event.dataType === "source" &&
    Boolean(event.tile)
  );
}

export function attachGoogleMapTilesQuotaMonitor(
  map: MapLibreMap,
  callbacks: GoogleMapTilesQuotaMonitorCallbacks,
): () => void {
  let counters: GoogleTileLoadCounters = createGoogleTileLoadCounters();
  let reverted = false;

  const revertToPositron = (): void => {
    if (reverted) return;
    reverted = true;
    markGoogleMapTilesQuotaFallbackActive();
    warnGoogleTileQuotaFallbackOnce();
    detachGoogleMapTilesAttribution(map);

    const finish = (): void => {
      callbacks.restoreOpenFreeMapAttribution();
      callbacks.onReverted();
    };

    void map.once("style.load", finish);
    void map.setStyle(homeMapInitialStyleUrl());
  };

  const onError = (event: ErrorEvent): void => {
    if (reverted || !isGoogleRoadmapMapError(event)) return;
    const step = recordGoogleTileLoadFailure(counters);
    counters = step.counters;
    if (step.shouldFallback) revertToPositron();
  };

  const onData = (event: MapSourceDataEvent): void => {
    if (reverted || !isGoogleRoadmapTileLoaded(event)) return;
    const step = recordGoogleTileLoadSuccess(counters);
    counters = step.counters;
  };

  map.on("error", onError);
  map.on("data", onData);

  return () => {
    map.off("error", onError);
    map.off("data", onData);
  };
}
