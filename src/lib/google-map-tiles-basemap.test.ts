import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildGoogleMapTilesMapStyle,
  clearCachedGoogleMapTilesSession,
  createGoogleMapTilesSession,
  googleMapTilesLanguageRegion,
  googleMapTilesRasterUrlTemplate,
  readCachedGoogleMapTilesSession,
  writeCachedGoogleMapTilesSession,
} from "~/lib/google-map-tiles-basemap";

describe("google map tiles locale mapping", () => {
  it("maps home/pilgrimage locales to Map Tiles API language and region", () => {
    expect(googleMapTilesLanguageRegion("ja")).toEqual({
      language: "ja",
      region: "JP",
    });
    expect(googleMapTilesLanguageRegion("en")).toEqual({
      language: "en",
      region: "JP",
    });
    expect(googleMapTilesLanguageRegion("zh")).toEqual({
      language: "zh-CN",
      region: "JP",
    });
    expect(googleMapTilesLanguageRegion("zh-tw")).toEqual({
      language: "zh-TW",
      region: "JP",
    });
  });
});

describe("google map tiles session cache", () => {
  afterEach(() => {
    clearCachedGoogleMapTilesSession();
    vi.unstubAllGlobals();
  });

  it("reads and writes sessionStorage without cookies", () => {
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
    writeCachedGoogleMapTilesSession("ja", "JP", "sess-test", 4_000_000_000);
    expect(readCachedGoogleMapTilesSession("ja", "JP", 3_000_000_000)).toBe(
      "sess-test",
    );
    expect(readCachedGoogleMapTilesSession("en", "JP", 3_000_000_000)).toBe(
      null,
    );
  });
});

describe("google map tiles style", () => {
  it("builds a 256px raster MapLibre style", () => {
    const style = buildGoogleMapTilesMapStyle("sess", "test-key");
    const source = style.sources?.["google-roadmap"];
    expect(source).toMatchObject({ type: "raster", tileSize: 256 });
    expect(googleMapTilesRasterUrlTemplate("sess", "test-key")).toContain(
      "session=sess",
    );
    expect(googleMapTilesRasterUrlTemplate("sess", "test-key")).toContain(
      "key=test-key",
    );
  });
});

describe("createGoogleMapTilesSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearCachedGoogleMapTilesSession();
  });

  it("returns a structured failure when the API key is missing", async () => {
    const result = await createGoogleMapTilesSession("ja", "");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("not configured");
  });

  it("surfaces API errors from createSession", async () => {
    clearCachedGoogleMapTilesSession();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            status: "PERMISSION_DENIED",
            message: "Map Tiles API has not been used in project 123 before",
          },
        }),
      })),
    );
    const result = await createGoogleMapTilesSession("ja", "test-key");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(result.googleStatus).toBe("PERMISSION_DENIED");
  });
});
