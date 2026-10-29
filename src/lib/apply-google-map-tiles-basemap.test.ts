import { describe, expect, it, vi, afterEach } from "vitest";
import {
  applyGoogleMapTilesBasemap,
  resetGoogleMapTilesBasemapWarnForTests,
} from "~/lib/apply-google-map-tiles-basemap";
import { clearCachedGoogleMapTilesSession } from "~/lib/google-map-tiles-basemap";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

vi.mock("~/components/map/google-map-tiles-attribution-control", () => ({
  mountGoogleMapTilesAttribution: vi.fn(),
  detachGoogleMapTilesAttribution: vi.fn(),
  GOOGLE_MAP_TILES_ATTRIBUTION_Z_INDEX: 40,
}));

function createMockMap() {
  const listeners: Record<string, Array<() => void>> = {};
  const canvas = { style: {} as CSSStyleDeclaration };
  return {
    canvas,
    styleUrl: "",
    getCanvas: () => canvas as unknown as HTMLCanvasElement,
    once: (event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    emit: (event: string) => {
      for (const handler of listeners[event] ?? []) handler();
      listeners[event] = [];
    },
    setStyle: vi.fn(function (this: { styleUrl: string }, url: unknown) {
      this.styleUrl = typeof url === "string" ? url : "inline-style";
    }),
  };
}

describe("applyGoogleMapTilesBasemap", () => {
  afterEach(() => {
    resetGoogleMapTilesBasemapWarnForTests();
    clearCachedGoogleMapTilesSession();
    vi.unstubAllGlobals();
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
    let ready = false;
    const onFallback = vi.fn();
    const resultPromise = applyGoogleMapTilesBasemap(
      map as never,
      "ja",
      () => {
        ready = true;
      },
      "home",
      { onFallbackToOpenFreemap: onFallback },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    map.emit("style.load");
    const result = await resultPromise;
    expect(result.applied).toBe(false);
    expect(result.activeBasemap).toBe("openfreemap");
    expect(map.styleUrl).toBe(OPENFREEMAP_POSITRON_STYLE);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(ready).toBe(true);
  });

  it("applies Google style and waits for idle before onStyleReady", async () => {
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
    let ready = false;
    const onVisible = vi.fn();
    const resultPromise = applyGoogleMapTilesBasemap(
      map as never,
      "ja",
      () => {
        ready = true;
      },
      "home",
      { onGoogleBasemapVisible: onVisible },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ready).toBe(false);
    map.emit("style.load");
    expect(ready).toBe(false);
    expect(onVisible).toHaveBeenCalledTimes(0);
    map.emit("idle");
    const result = await resultPromise;
    expect(result.applied).toBe(true);
    expect(ready).toBe(true);
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(map.canvas.style.opacity).toBe("1");
  });
});
