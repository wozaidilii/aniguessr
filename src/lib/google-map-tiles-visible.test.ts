import { describe, expect, it, vi } from "vitest";
import { whenGoogleRoadmapTilesVisible } from "~/lib/google-map-tiles-visible";

function createMockMap(initialLoaded = false) {
  const listeners: Record<string, Array<(event: unknown) => void>> = {};
  let sourceLoaded = initialLoaded;
  let tilesLoaded = initialLoaded;
  return {
    on: (event: string, handler: (event: unknown) => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    off: (event: string, handler: (event: unknown) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    },
    emit: (event: string, payload: unknown) => {
      for (const handler of listeners[event] ?? []) handler(payload);
    },
    isSourceLoaded: () => sourceLoaded,
    areTilesLoaded: () => tilesLoaded,
    markLoaded: () => {
      sourceLoaded = true;
      tilesLoaded = true;
    },
  };
}

describe("whenGoogleRoadmapTilesVisible", () => {
  it("fires on first google-roadmap tile data event", () => {
    const map = createMockMap();
    const onVisible = vi.fn();
    whenGoogleRoadmapTilesVisible(map as never, onVisible);
    map.emit("data", {
      sourceId: "google-roadmap",
      dataType: "source",
      tile: {},
    });
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it("fires immediately when source and tiles are already loaded", () => {
    const map = createMockMap(true);
    const onVisible = vi.fn();
    whenGoogleRoadmapTilesVisible(map as never, onVisible);
    expect(onVisible).toHaveBeenCalledTimes(1);
  });
});
