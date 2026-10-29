import { describe, expect, it, vi } from "vitest";
import { geographicBoundsFromMapCanvas } from "~/lib/home-map-bounds-publish";

describe("geographicBoundsFromMapCanvas", () => {
  it("uses all four canvas corners instead of padded getBounds()", () => {
    const map = {
      getContainer: () => ({ clientWidth: 400, clientHeight: 300 }),
      unproject: (point: [number, number]) => {
        const [x, y] = point;
        if (x === 0 && y === 0) return { lng: 139.0, lat: 35.5 };
        if (x === 400 && y === 0) return { lng: 139.4, lat: 35.5 };
        if (x === 0 && y === 300) return { lng: 139.0, lat: 35.2 };
        if (x === 400 && y === 300) return { lng: 139.4, lat: 35.2 };
        return { lng: 0, lat: 0 };
      },
      getBounds: () => ({
        getWest: () => 139.2,
        getSouth: () => 35.25,
        getEast: () => 139.25,
        getNorth: () => 35.35,
      }),
    };
    expect(geographicBoundsFromMapCanvas(map as never)).toEqual({
      west: 139.0,
      south: 35.2,
      east: 139.4,
      north: 35.5,
    });
  });

  it("falls back to getBounds when the canvas has no size", () => {
    const map = {
      getContainer: () => ({ clientWidth: 0, clientHeight: 0 }),
      getBounds: () => ({
        getWest: () => 1,
        getSouth: () => 2,
        getEast: () => 3,
        getNorth: () => 4,
      }),
    };
    expect(geographicBoundsFromMapCanvas(map as never)).toEqual({
      west: 1,
      south: 2,
      east: 3,
      north: 4,
    });
  });
});
