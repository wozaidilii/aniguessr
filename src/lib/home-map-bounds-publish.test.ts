import { describe, expect, it, vi } from "vitest";
import { geographicBoundsFromMapCanvas } from "~/lib/home-map-bounds-publish";

describe("geographicBoundsFromMapCanvas", () => {
  it("uses all four canvas corners instead of padded getBounds()", () => {
    const map = {
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
      setPadding: () => undefined,
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

  it("clears map padding while measuring corners", () => {
    let padding = { top: 0, bottom: 180, left: 24, right: 24 };
    const setPadding = vi.fn((value: typeof padding) => {
      padding = value;
    });
    const map = {
      getPadding: () => padding,
      setPadding,
      getContainer: () => ({ clientWidth: 390, clientHeight: 420 }),
      unproject: (point: [number, number]) => {
        if (padding.bottom > 0) {
          return { lng: 139.48, lat: 35.3 };
        }
        const [x, y] = point;
        if (x === 0 && y === 0) return { lng: 139.42, lat: 35.36 };
        if (x === 390 && y === 420) return { lng: 139.56, lat: 35.24 };
        if (x === 390 && y === 0) return { lng: 139.56, lat: 35.36 };
        if (x === 0 && y === 420) return { lng: 139.42, lat: 35.24 };
        return { lng: 139.48, lat: 35.3 };
      },
      getBounds: () => ({
        getWest: () => 139.47,
        getSouth: () => 35.29,
        getEast: () => 139.49,
        getNorth: () => 35.31,
      }),
    };
    expect(geographicBoundsFromMapCanvas(map as never)).toEqual({
      west: 139.42,
      south: 35.24,
      east: 139.56,
      north: 35.36,
    });
    expect(setPadding).toHaveBeenCalledWith({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    expect(setPadding).toHaveBeenCalledWith({
      top: 0,
      bottom: 180,
      left: 24,
      right: 24,
    });
  });

  it("falls back to getBounds when the canvas has no size", () => {
    const map = {
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
      setPadding: () => undefined,
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
