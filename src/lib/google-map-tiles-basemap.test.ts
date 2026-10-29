import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildGoogleMapTilesCreateSessionBody,
  buildGoogleMapTilesMapStyle,
  buildGoogleMapTilesViewportUrl,
  clearCachedGoogleMapTilesSession,
  createGoogleMapTilesSession,
  fetchGoogleMapTilesViewportAttribution,
  GOOGLE_MAP_TILES_LOGO_PATH,
  GOOGLE_MAP_TILES_SESSION_STYLES_VERSION,
  GOOGLE_MAP_TILES_VIEWPORT_URL,
  googleMapTilesCreateSessionStyles,
  googleMapTilesLanguageRegion,
  googleMapTilesRasterUrlTemplate,
  googleMapTilesSessionCacheFingerprint,
  googleMapTilesSessionCacheStorageKey,
  readCachedGoogleMapTilesSession,
  resetGoogleMapTilesViewportAttributionCacheForTests,
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

describe("google map tiles createSession styles", () => {
  it("hides all POI and natural-feature labels while keeping geometry fills", () => {
    const styles = googleMapTilesCreateSessionStyles();
    expect(styles).toEqual([
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "poi",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "landscape.natural",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "landscape.natural",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
    ]);
    expect(
      styles.some(
        (rule) =>
          rule.elementType === "geometry" ||
          rule.elementType === "geometry.fill",
      ),
    ).toBe(false);
    expect(
      styles.some((rule) => rule.stylers.some((s) => s.visibility === "off") &&
        !rule.elementType),
    ).toBe(false);
  });

  it("includes styles in the createSession POST body", () => {
    const body = buildGoogleMapTilesCreateSessionBody("zh-TW", "JP");
    expect(body).toEqual({
      mapType: "roadmap",
      language: "zh-TW",
      region: "JP",
      styles: googleMapTilesCreateSessionStyles(),
    });
  });
});

describe("google map tiles session cache versioning", () => {
  afterEach(() => {
    clearCachedGoogleMapTilesSession();
    vi.unstubAllGlobals();
  });

  it("uses v2 storage key and styles version in the fingerprint", () => {
    expect(googleMapTilesSessionCacheStorageKey()).toBe(
      "aniguessr.googleMapTilesSession.v2",
    );
    expect(googleMapTilesSessionCacheFingerprint("ja", "JP")).toBe(
      `ja|JP|${GOOGLE_MAP_TILES_SESSION_STYLES_VERSION}`,
    );
  });

  it("ignores legacy v1 cache entries without stylesVersion", () => {
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
    store.set(
      "aniguessr.googleMapTilesSession.v1",
      JSON.stringify({
        language: "ja",
        region: "JP",
        session: "legacy-session",
        expirySec: 4_000_000_000,
      }),
    );
    expect(readCachedGoogleMapTilesSession("ja", "JP", 3_000_000_000)).toBe(
      null,
    );
  });

  it("invalidates cache when stylesVersion on disk does not match", () => {
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
    store.set(
      googleMapTilesSessionCacheStorageKey(),
      JSON.stringify({
        language: "ja",
        region: "JP",
        stylesVersion: "old-styles",
        session: "stale-session",
        expirySec: 4_000_000_000,
      }),
    );
    expect(readCachedGoogleMapTilesSession("ja", "JP", 3_000_000_000)).toBe(
      null,
    );
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
    const style = buildGoogleMapTilesMapStyle("sess", "test-key", 200);
    const source = style.sources?.["google-roadmap"];
    expect(source).toMatchObject({ type: "raster", tileSize: 256 });
    const layer = style.layers?.[0];
    expect(layer).toMatchObject({
      id: "google-roadmap",
      paint: { "raster-fade-duration": 200 },
    });
    expect(googleMapTilesRasterUrlTemplate("sess", "test-key")).toContain(
      "session=sess",
    );
    expect(googleMapTilesRasterUrlTemplate("sess", "test-key")).toContain(
      "key=test-key",
    );
  });

  it("uses the self-hosted Google logo path", () => {
    expect(GOOGLE_MAP_TILES_LOGO_PATH).toBe(
      "/images/maps/google-powered-by-on-white.png",
    );
    const filePath = path.join(
      process.cwd(),
      "public",
      "images",
      "maps",
      "google-powered-by-on-white.png",
    );
    const bytes = readFileSync(filePath);
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
  });

  it("builds viewport attribution URLs on /tile/v1/viewport", () => {
    expect(GOOGLE_MAP_TILES_VIEWPORT_URL).toBe(
      "https://tile.googleapis.com/tile/v1/viewport",
    );
    const url = buildGoogleMapTilesViewportUrl("sess", "test-key", {
      north: 36,
      south: 35,
      east: 140,
      west: 139,
      zoom: 10,
    });
    expect(url.startsWith(GOOGLE_MAP_TILES_VIEWPORT_URL)).toBe(true);
    expect(url).not.toContain("tile.googleapis.com/v1/viewport");
    expect(url).toContain("session=sess");
  });

  it("dedupes in-flight viewport attribution requests for the same bounds", async () => {
    resetGoogleMapTilesViewportAttributionCacheForTests();
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ copyright: "© Google" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const bounds = {
      north: 36,
      south: 35,
      east: 140,
      west: 139,
      zoom: 10,
    };
    const [a, b] = await Promise.all([
      fetchGoogleMapTilesViewportAttribution("sess", "test-key", bounds),
      fetchGoogleMapTilesViewportAttribution("sess", "test-key", bounds),
    ]);
    expect(a?.copyright).toBe("© Google");
    expect(b?.copyright).toBe("© Google");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const again = await fetchGoogleMapTilesViewportAttribution(
      "sess",
      "test-key",
      bounds,
    );
    expect(again?.copyright).toBe("© Google");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    resetGoogleMapTilesViewportAttributionCacheForTests();
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

  it("posts styles with createSession", async () => {
    clearCachedGoogleMapTilesSession();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ session: "new-session", expiry: "4000000000" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createGoogleMapTilesSession("zh-tw", "test-key");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]![1];
    expect(typeof init?.body).toBe("string");
    const body = JSON.parse(init!.body as string) as {
      styles: unknown[];
      language: string;
      region: string;
    };
    expect(body.language).toBe("zh-TW");
    expect(body.region).toBe("JP");
    expect(body.styles).toEqual(googleMapTilesCreateSessionStyles());
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
