import { describe, expect, it, vi } from "vitest";
import {
  homeMapBasemapMode,
  homeMapInitialStyleUrl,
  resolveHomeMapInitialStyle,
  shouldAttemptGoogleMapTilesBasemap,
  shouldTuneOpenFreemapPlaceLabels,
} from "~/lib/home-map-basemap";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";
import {
  clearGoogleMapTilesQuotaFallbackFlag,
  GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY,
  markGoogleMapTilesQuotaFallbackActive,
} from "~/lib/google-map-tiles-quota-fallback";

describe("home map basemap mode", () => {
  it("defaults to google unless openfreemap is set", () => {
    expect(homeMapBasemapMode()).toBe("google");
  });

  it("uses Positron as the initial style URL", () => {
    expect(homeMapInitialStyleUrl()).toBe(OPENFREEMAP_POSITRON_STYLE);
  });

  it("uses an empty placeholder style when Google tiles will load", () => {
    const prevTiles = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    const prevAk = process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
    delete process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
    process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = "test-key";
    try {
      const style = resolveHomeMapInitialStyle();
      expect(typeof style).toBe("object");
      if (typeof style === "object") {
        expect(style.sources).toEqual({});
      }
    } finally {
      if (prevTiles === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = prevTiles;
      }
      if (prevAk === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = prevAk;
      }
    }
  });

  it("skips OpenFreeMap label tuning on the Google basemap", () => {
    expect(shouldTuneOpenFreemapPlaceLabels("google")).toBe(false);
    expect(shouldTuneOpenFreemapPlaceLabels("openfreemap")).toBe(true);
  });

  it("does not attempt Google tiles without a configured tiles key", () => {
    expect(shouldAttemptGoogleMapTilesBasemap()).toBe(false);
  });
});

describe("home map basemap with tiles key", () => {
  it("attempts Google tiles when NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY is set", () => {
    const prev = process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
    const prevTiles = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    delete process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
    process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = "tiles-key";
    try {
      expect(shouldAttemptGoogleMapTilesBasemap()).toBe(true);
    } finally {
      if (prev === undefined) {
        delete process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
      } else {
        process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP = prev;
      }
      if (prevTiles === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = prevTiles;
      }
    }
  });

  it("skips Google tiles when quota fallback is active in sessionStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    const prevTiles = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = "tiles-key";
    try {
      markGoogleMapTilesQuotaFallbackActive();
      expect(store.get(GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY)).toBe("1");
      expect(shouldAttemptGoogleMapTilesBasemap()).toBe(false);
    } finally {
      clearGoogleMapTilesQuotaFallbackFlag();
      vi.unstubAllGlobals();
      if (prevTiles === undefined) {
        delete process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
      } else {
        process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = prevTiles;
      }
    }
  });
});

describe("home map basemap mode with env override", () => {
  it("honors NEXT_PUBLIC_HOME_MAP_BASEMAP=openfreemap", () => {
    const previous = process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
    process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP = "openfreemap";
    try {
      expect(homeMapBasemapMode()).toBe("openfreemap");
      expect(shouldAttemptGoogleMapTilesBasemap()).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP;
      } else {
        process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP = previous;
      }
    }
  });
});
