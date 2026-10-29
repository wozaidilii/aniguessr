import { describe, expect, it } from "vitest";
import {
  homeMapBasemapMode,
  homeMapInitialStyleUrl,
  shouldAttemptGoogleMapTilesBasemap,
  shouldTuneOpenFreemapPlaceLabels,
} from "~/lib/home-map-basemap";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

describe("home map basemap mode", () => {
  it("defaults to google unless openfreemap is set", () => {
    expect(homeMapBasemapMode()).toBe("google");
  });

  it("uses Positron as the initial style URL", () => {
    expect(homeMapInitialStyleUrl()).toBe(OPENFREEMAP_POSITRON_STYLE);
  });

  it("skips OpenFreeMap label tuning on the Google basemap", () => {
    expect(shouldTuneOpenFreemapPlaceLabels("google")).toBe(false);
    expect(shouldTuneOpenFreemapPlaceLabels("openfreemap")).toBe(true);
  });

  it("does not attempt Google tiles without a public API key", () => {
    expect(shouldAttemptGoogleMapTilesBasemap()).toBe(false);
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
