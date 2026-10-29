import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleMapBasemapPlaceholderStyle,
  GOOGLE_MAP_BASEMAP_GROUND_COLOR,
  GOOGLE_MAP_TILES_PRECONNECT_ORIGIN,
} from "~/lib/google-map-basemap-placeholder";
import { googleMapTilesRasterFadeMs } from "~/lib/google-map-tiles-basemap";

describe("google map basemap placeholder", () => {
  it("uses an empty style with no tile sources", () => {
    const style = buildGoogleMapBasemapPlaceholderStyle();
    expect(style.version).toBe(8);
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([]);
  });

  it("exposes the designer ground color and preconnect origin", () => {
    expect(GOOGLE_MAP_BASEMAP_GROUND_COLOR).toBe("#F5F3EF");
    expect(GOOGLE_MAP_TILES_PRECONNECT_ORIGIN).toBe(
      "https://tile.googleapis.com",
    );
  });

  it("respects reduced motion for raster fade duration", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    expect(googleMapTilesRasterFadeMs()).toBe(0);
    vi.unstubAllGlobals();
  });
});
