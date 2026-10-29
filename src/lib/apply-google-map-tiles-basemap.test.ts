import { describe, expect, it, vi, afterEach } from "vitest";
import {
  applyGoogleMapTilesBasemap,
  resetGoogleMapTilesBasemapWarnForTests,
} from "~/lib/apply-google-map-tiles-basemap";
import { clearCachedGoogleMapTilesSession } from "~/lib/google-map-tiles-basemap";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";
import { mountGoogleMapTilesAttribution } from "~/components/map/google-map-tiles-attribution-control";

vi.mock("~/components/map/google-map-tiles-attribution-control", () => ({
  mountGoogleMapTilesAttribution: vi.fn(),
  detachGoogleMapTilesAttribution: vi.fn(),
  GOOGLE_MAP_TILES_ATTRIBUTION_Z_INDEX: 40,
}));

function createMockMap() {
  const listeners: Record<string, Array<(event?: unknown) => void>> = {};
  const canvas = { style: {} as CSSStyleDeclaration };
  return {
    canvas,
    styleUrl: "",
    getCanvas: () => canvas as unknown as HTMLCanvasElement,
    once: (event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    on: (event: string, handler: (event?: unknown) => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    off: (event: string, handler: (event?: unknown) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    },
    emit: (event: string, payload?: unknown) => {
      for (const handler of listeners[event] ?? []) handler(payload);
    },
    isSourceLoaded: () => false,
    areTilesLoaded: () => false,
    setStyle: vi.fn(function (this: { styleUrl: string }, url: unknown, options?: { diff?: boolean }) {
      this.styleUrl = typeof url === "string" ? url : "inline-style";
      expect(options).toEqual({ diff: false });
    }),
  };
}

describe("applyGoogleMapTilesBasemap", () => {
  afterEach(() => {
    resetGoogleMapTilesBasemapWarnForTests();
    clearCachedGoogleMapTilesSession();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads Positron when createSession fails on the placeholder path", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "denied" } }),
      })),
    );
    const map = createMockMap();
    let readyBasemap: string | undefined;
    const onFallback = vi.fn();
    const restoreAttribution = vi.fn();
    const resultPromise = applyGoogleMapTilesBasemap(
      map as never,
      "ja",
      (basemap) => {
        readyBasemap = basemap;
      },
      "home",
      {
        onFallbackToOpenFreemap: onFallback,
        restoreOpenFreeMapAttribution: restoreAttribution,
        onRevertedToOpenFreemap: vi.fn(),
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    map.emit("style.load");
    const result = await resultPromise;
    expect(result.applied).toBe(false);
    expect(result.activeBasemap).toBe("openfreemap");
    expect(map.styleUrl).toBe(OPENFREEMAP_POSITRON_STYLE);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(readyBasemap).toBe("openfreemap");
  });

  it("loads Positron when API key is missing", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const map = createMockMap();
    let readyBasemap: string | undefined;
    const resultPromise = applyGoogleMapTilesBasemap(
      map as never,
      "ja",
      (basemap) => {
        readyBasemap = basemap;
      },
      "home",
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    map.emit("style.load");
    const result = await resultPromise;
    expect(result.applied).toBe(false);
    expect(readyBasemap).toBe("openfreemap");
  });

  it("calls onStyleReady on style.load and fades after first roadmap tile", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAP_AK = "test-key";
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("createSession")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ session: "sess-1", expiry: "4000000000" }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ copyright: "© Google" }),
        };
      }),
    );
    const map = createMockMap();
    let readyBasemap: string | undefined;
    const onVisible = vi.fn();
    const resultPromise = applyGoogleMapTilesBasemap(
      map as never,
      "ja",
      (basemap) => {
        readyBasemap = basemap;
      },
      "home",
      { onGoogleBasemapVisible: onVisible },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(readyBasemap).toBeUndefined();
    map.emit("style.load");
    expect(readyBasemap).toBe("google");
    expect(onVisible).toHaveBeenCalledTimes(0);
    map.emit("data", {
      sourceId: "google-roadmap",
      dataType: "source",
      tile: {},
    });
    const result = await resultPromise;
    expect(result.applied).toBe(true);
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(mountGoogleMapTilesAttribution).toHaveBeenCalledTimes(1);
    expect(map.canvas.style.opacity).toBe("1");
  });
});
