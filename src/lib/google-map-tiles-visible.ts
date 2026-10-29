import type { Map as MapLibreMap, MapSourceDataEvent } from "maplibre-gl";

const GOOGLE_ROADMAP_SOURCE = "google-roadmap";

function googleRoadmapTileEvent(event: MapSourceDataEvent): boolean {
  return (
    event.sourceId === GOOGLE_ROADMAP_SOURCE &&
    event.dataType === "source" &&
    Boolean(event.tile)
  );
}

/** Runs once when the Google roadmap source has loaded at least one tile. */
export function whenGoogleRoadmapTilesVisible(
  map: MapLibreMap,
  onVisible: () => void,
): () => void {
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    cleanup();
    onVisible();
  };

  const onData = (event: MapSourceDataEvent): void => {
    if (googleRoadmapTileEvent(event)) finish();
  };

  const onSourceData = (event: MapSourceDataEvent): void => {
    if (
      event.sourceId === GOOGLE_ROADMAP_SOURCE &&
      event.isSourceLoaded &&
      map.areTilesLoaded()
    ) {
      finish();
    }
  };

  const cleanup = (): void => {
    map.off("data", onData);
    map.off("sourcedata", onSourceData);
  };

  if (map.isSourceLoaded(GOOGLE_ROADMAP_SOURCE) && map.areTilesLoaded()) {
    finish();
    return () => undefined;
  }

  map.on("data", onData);
  map.on("sourcedata", onSourceData);
  return cleanup;
}
