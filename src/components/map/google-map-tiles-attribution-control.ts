import type { Map as MapLibreMap } from "maplibre-gl";
import {
  GOOGLE_MAP_TILES_LOGO_PATH,
  fetchGoogleMapTilesViewportAttribution,
} from "~/lib/google-map-tiles-basemap";

export type GoogleMapTilesAttributionSurface = "home" | "pilgrimage";

const detachByMap = new WeakMap<MapLibreMap, () => void>();

/** Google logo + viewport copyright; positioned above home sheet / within map viewport. */
export class GoogleMapTilesAttributionOverlay {
  private map: MapLibreMap | undefined;
  private container: HTMLDivElement | undefined;
  private copyrightEl: HTMLSpanElement | undefined;
  private refreshTimer = 0;
  private resizeObserver: ResizeObserver | undefined;
  private readonly session: string;
  private readonly apiKey: string;
  private readonly surface: GoogleMapTilesAttributionSurface;

  constructor(
    session: string,
    apiKey: string,
    surface: GoogleMapTilesAttributionSurface,
  ) {
    this.session = session;
    this.apiKey = apiKey;
    this.surface = surface;
  }

  attach(map: MapLibreMap): void {
    this.detach();
    this.map = map;
    const container = document.createElement("div");
    container.className = `google-map-tiles-attribution google-map-tiles-attribution--${this.surface}`;
    container.setAttribute("aria-label", "Google Maps");
    const logo = document.createElement("img");
    logo.src = GOOGLE_MAP_TILES_LOGO_PATH;
    logo.alt = "Google";
    logo.width = 120;
    logo.height = 14;
    logo.decoding = "async";
    const copyright = document.createElement("span");
    copyright.className = "google-map-tiles-attribution-text";
    container.append(logo, copyright);
    this.container = container;
    this.copyrightEl = copyright;

    const anchor =
      this.surface === "home"
        ? map.getContainer().closest(".home-map")
        : map.getContainer().closest(".pilgrimage-map");
    (anchor ?? map.getContainer()).appendChild(container);

    map.on("moveend", this.scheduleRefresh);
    map.on("resize", this.scheduleRefresh);
    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleRefresh();
    });
    if (this.surface === "home") {
      const sheet = document.querySelector(".home-nearby-sheet");
      if (sheet) this.resizeObserver.observe(sheet);
      const homeRoot = map.getContainer().closest(".home");
      if (homeRoot) this.resizeObserver.observe(homeRoot);
    } else {
      this.resizeObserver.observe(map.getContainer());
    }

    this.scheduleRefresh();
  }

  detach(): void {
    if (this.map) {
      this.map.off("moveend", this.scheduleRefresh);
      this.map.off("resize", this.scheduleRefresh);
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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

export function mountGoogleMapTilesAttribution(
  map: MapLibreMap,
  session: string,
  apiKey: string,
  surface: GoogleMapTilesAttributionSurface,
): void {
  detachByMap.get(map)?.();
  const overlay = new GoogleMapTilesAttributionOverlay(
    session,
    apiKey,
    surface,
  );
  overlay.attach(map);
  detachByMap.set(map, () => overlay.detach());
}

export function detachGoogleMapTilesAttribution(map: MapLibreMap): void {
  detachByMap.get(map)?.();
  detachByMap.delete(map);
}
