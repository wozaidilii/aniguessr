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

export function googleMapBasemapFadeMs(): number {
  if (typeof window === "undefined") return 200;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
}

/** Fade raster tiles in after the Google style is applied. */
export function fadeInGoogleMapBasemapCanvas(
  map: { getCanvas: () => HTMLCanvasElement },
  durationMs = googleMapBasemapFadeMs(),
): void {
  const canvas = map.getCanvas();
  canvas.style.opacity = "0";
  if (durationMs <= 0) {
    canvas.style.transition = "";
    canvas.style.opacity = "1";
    return;
  }
  canvas.style.transition = `opacity ${durationMs}ms ease`;
  requestAnimationFrame(() => {
    canvas.style.opacity = "1";
  });
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
