import { describe, expect, it, vi, afterEach } from "vitest";
import {
  attachGoogleMapTilesQuotaMonitor,
  resetGoogleMapTilesTileQuotaWarnForTests,
} from "~/lib/google-map-tiles-quota-monitor";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

vi.mock("~/components/map/google-map-tiles-attribution-control", () => ({
  detachGoogleMapTilesAttribution: vi.fn(),
}));

function createMockMap() {
  const listeners: Record<string, Array<(event?: unknown) => void>> = {};
  return {
    listeners,
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
    once: (event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    setStyle: vi.fn(function (this: { styleUrl: string }, url: unknown, options?: { diff?: boolean }) {
      this.styleUrl = typeof url === "string" ? url : "inline-style";
      expect(options).toEqual({ diff: false });
    }),
    styleUrl: "",
  };
}

describe("attachGoogleMapTilesQuotaMonitor", () => {
  afterEach(() => {
    resetGoogleMapTilesTileQuotaWarnForTests();
  });

  it("reverts to Positron with diff false and restores OpenFreeMap attribution", () => {
    const map = createMockMap();
    const restore = vi.fn();
    const onReverted = vi.fn();
    attachGoogleMapTilesQuotaMonitor(map as never, {
      restoreOpenFreeMapAttribution: restore,
      onReverted,
    });
    for (let i = 0; i < 5; i += 1) {
      map.emit("error", {
        sourceId: "google-roadmap",
        error: new Error("403"),
      });
    }
    map.emit("style.load");
    expect(map.styleUrl).toBe(OPENFREEMAP_POSITRON_STYLE);
    expect(restore).toHaveBeenCalledTimes(1);
    expect(onReverted).toHaveBeenCalledTimes(1);
  });
});
