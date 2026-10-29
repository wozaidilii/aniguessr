import { describe, expect, it } from "vitest";
import { resolveGoogleMapTilesApiKey } from "~/lib/google-map-tiles-api-key";

describe("resolveGoogleMapTilesApiKey", () => {
  it("prefers NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY over NEXT_PUBLIC_GOOGLE_MAP_AK", () => {
    const prevTiles = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    const prevAk = process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
    process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY = "tiles-key";
    process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = "js-key";
    try {
      expect(resolveGoogleMapTilesApiKey()).toBe("tiles-key");
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

  it("falls back to the JS API key when tiles key is unset", () => {
    const prevTiles = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    const prevAk = process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;
    process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = "js-only";
    try {
      expect(resolveGoogleMapTilesApiKey()).toBe("js-only");
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
});
