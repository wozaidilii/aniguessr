import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import {
  GOOGLE_MAP_TILES_LOGO_URL,
  fetchGoogleMapTilesViewportAttribution,
} from "~/lib/google-map-tiles-basemap";

/** Google logo + viewport copyright; kept clear of home floats via CSS. */
export class GoogleMapTilesAttributionControl implements IControl {
  private map: MapLibreMap | undefined;
  private container: HTMLDivElement | undefined;
  private copyrightEl: HTMLSpanElement | undefined;
  private refreshTimer = 0;
  private readonly session: string;
  private readonly apiKey: string;

  constructor(session: string, apiKey: string) {
    this.session = session;
    this.apiKey = apiKey;
  }

  onAdd(map: MapLibreMap): HTMLElement {
    this.map = map;
    const container = document.createElement("div");
    container.className =
      "maplibregl-ctrl maplibregl-ctrl-group google-map-tiles-attribution";
    const logo = document.createElement("img");
    logo.src = GOOGLE_MAP_TILES_LOGO_URL;
    logo.alt = "Google";
    logo.width = 66;
    logo.height = 18;
    logo.decoding = "async";
    logo.loading = "lazy";
    const copyright = document.createElement("span");
    copyright.className = "google-map-tiles-attribution-text";
    container.append(logo, copyright);
    this.container = container;
    this.copyrightEl = copyright;
    map.on("moveend", this.scheduleRefresh);
    this.scheduleRefresh();
    return container;
  }

  onRemove(): void {
    if (this.map) {
      this.map.off("moveend", this.scheduleRefresh);
    }
    window.clearTimeout(this.refreshTimer);
    this.container?.remove();
    this.container = undefined;
    this.copyrightEl = undefined;
    this.map = undefined;
  }

  private scheduleRefresh = (): void => {
    window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      void this.refresh();
    }, 200);
  };

  private async refresh(): Promise<void> {
    const map = this.map;
    const copyrightEl = this.copyrightEl;
    if (!map || !copyrightEl) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const result = await fetchGoogleMapTilesViewportAttribution(
      this.session,
      this.apiKey,
      {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        zoom,
      },
    );
    copyrightEl.textContent = result?.copyright ?? "";
  }
}
