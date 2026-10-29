import type { StyleSpecification } from "maplibre-gl";

/** Ground color shown while Google roadmap tiles load (designer spec). */
export const GOOGLE_MAP_BASEMAP_GROUND_COLOR = "#F5F3EF";

export const GOOGLE_MAP_TILES_PRECONNECT_ORIGIN = "https://tile.googleapis.com";

/** Empty MapLibre style — no raster sources, no Positron requests. */
export function buildGoogleMapBasemapPlaceholderStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [],
  };
}

export function injectGoogleMapTilesPreconnect(): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(
    'link[rel="preconnect"][href="https://tile.googleapis.com"]',
  );
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = GOOGLE_MAP_TILES_PRECONNECT_ORIGIN;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}
