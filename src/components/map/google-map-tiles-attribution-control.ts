import type { Map as MapLibreMap } from "maplibre-gl";
import {
  GOOGLE_MAP_TILES_LOGO_PATH,
  fetchGoogleMapTilesViewportAttribution,
} from "~/lib/google-map-tiles-basemap";

export type GoogleMapTilesAttributionSurface = "home" | "pilgrimage";

/** Above MapLibre HTML markers (e.g. home “you” at 30); map symbol pills stay on canvas below. */
export const GOOGLE_MAP_TILES_ATTRIBUTION_Z_INDEX = 40;

const detachByMap = new WeakMap<MapLibreMap, () => void>();

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Google logo failed to load"));
  });
}

export class GoogleMapTilesAttributionOverlay {
  private map: MapLibreMap | undefined;
  private container: HTMLDivElement | undefined;
  private copyrightEl: HTMLSpanElement | undefined;
  private refreshTimer = 0;
  private resizeObserver: ResizeObserver | undefined;
  private readonly session: string;
  private readonly apiKey: string;
  private readonly surface: GoogleMapTilesAttributionSurface;
  private mountGeneration = 0;

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
    const generation = ++this.mountGeneration;
    void this.mountWhenReady(map, generation);
  }

  private async mountWhenReady(
    map: MapLibreMap,
    generation: number,
  ): Promise<void> {
    const logo = document.createElement("img");
    logo.src = GOOGLE_MAP_TILES_LOGO_PATH;
    logo.alt = "Google";
    logo.width = 120;
    logo.height = 14;
    logo.decoding = "async";

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    let attribution: Awaited<
      ReturnType<typeof fetchGoogleMapTilesViewportAttribution>
    >;
    try {
      const [, fetched] = await Promise.all([
        waitForImage(logo),
        fetchGoogleMapTilesViewportAttribution(this.session, this.apiKey, {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom,
        }),
      ]);
      attribution = fetched;
    } catch {
      return;
    }

    if (generation !== this.mountGeneration || this.map !== map) return;

    const copyrightText = attribution?.copyright?.trim() ?? "";
    if (!copyrightText) return;

    const container = document.createElement("div");
    container.className = `google-map-tiles-attribution google-map-tiles-attribution--${this.surface}`;
    container.style.zIndex = String(GOOGLE_MAP_TILES_ATTRIBUTION_Z_INDEX);
    container.setAttribute("aria-label", "Google Maps");

    const copyright = document.createElement("span");
    copyright.className = "google-map-tiles-attribution-text";
    copyright.textContent = copyrightText;

    container.append(logo, copyright);

    const anchor =
      this.surface === "home"
        ? map.getContainer().closest(".home-map")
        : map.getContainer().closest(".pilgrimage-map");
    (anchor ?? map.getContainer()).appendChild(container);

    this.container = container;
    this.copyrightEl = copyright;

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
  }

  detach(): void {
    this.mountGeneration += 1;
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
    const text = result?.copyright?.trim() ?? "";
    if (text) copyrightEl.textContent = text;
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
