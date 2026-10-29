import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleMapBasemapPlaceholderStyle,
  GOOGLE_MAP_BASEMAP_GROUND_COLOR,
  GOOGLE_MAP_TILES_PRECONNECT_ORIGIN,
  googleMapBasemapFadeMs,
} from "~/lib/google-map-basemap-placeholder";

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

  it("respects reduced motion for fade duration", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    expect(googleMapBasemapFadeMs()).toBe(0);
    vi.unstubAllGlobals();
  });
});
