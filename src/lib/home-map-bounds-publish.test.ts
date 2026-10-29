import { afterEach, describe, expect, it, vi } from "vitest";
import * as boundsStore from "~/lib/home-bounds-store";
import { resetLatestHomeBoundsDetailForTests } from "~/lib/home-bounds-store";
import {
  geographicBoundsFromMapCanvas,
  publishHomeMapBounds,
  resetHomeMapBoundsPublishForTests,
} from "~/lib/home-map-bounds-publish";

describe("geographicBoundsFromMapCanvas", () => {
  afterEach(() => {
    resetHomeMapBoundsPublishForTests();
    resetLatestHomeBoundsDetailForTests();
  });

  it("uses all four canvas corners instead of padded getBounds()", () => {
    const setPadding = vi.fn();
    const map = {
      getPadding: () => ({ top: 0, bottom: 120, left: 0, right: 0 }),
      setPadding,
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
    expect(setPadding).not.toHaveBeenCalled();
  });

  it("falls back to getBounds when the canvas has no size", () => {
    const map = {
      getPadding: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

  it("ignores nested publishHomeMapBounds while publishing", () => {
    const map = {
      getContainer: () => ({ clientWidth: 100, clientHeight: 100 }),
      unproject: () => ({ lng: 139, lat: 35 }),
      getBounds: () => ({
        getWest: () => 1,
        getSouth: () => 2,
        getEast: () => 3,
        getNorth: () => 4,
      }),
      getCenter: () => ({ lat: 35, lng: 139 }),
    };
    let detailCalls = 0;
    const spy = vi
      .spyOn(boundsStore, "publishHomeBoundsDetail")
      .mockImplementation(() => {
        detailCalls += 1;
        if (detailCalls === 1) {
          publishHomeMapBounds(map as never);
        }
      });
    publishHomeMapBounds(map as never);
    expect(detailCalls).toBe(1);
    spy.mockRestore();
  });

  it("publishes once when setPadding or easeTo emit moveend synchronously", () => {
    const moveendHandlers: Array<() => void> = [];
    const map = {
      getContainer: () => ({ clientWidth: 100, clientHeight: 100 }),
      unproject: () => ({ lng: 139, lat: 35 }),
      getBounds: () => ({
        getWest: () => 1,
        getSouth: () => 2,
        getEast: () => 3,
        getNorth: () => 4,
      }),
      getCenter: () => ({ lat: 35, lng: 139 }),
      setPadding: () => {
        for (const handler of moveendHandlers) handler();
      },
      easeTo: () => {
        for (const handler of moveendHandlers) handler();
      },
    };
    const handler = () => publishHomeMapBounds(map as never);
    moveendHandlers.push(handler);

    let detailCalls = 0;
    const spy = vi
      .spyOn(boundsStore, "publishHomeBoundsDetail")
      .mockImplementation(() => {
        detailCalls += 1;
        if (detailCalls === 1) {
          (map as { setPadding: () => void }).setPadding();
          (map as { easeTo: () => void }).easeTo();
        }
      });

    handler();
    expect(detailCalls).toBe(1);
    spy.mockRestore();
  });
});
