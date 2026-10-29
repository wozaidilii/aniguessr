import { describe, expect, it, vi } from "vitest";
import type { HomeBoundsDetail } from "~/components/home/home-events";
import { resetLatestHomeBoundsDetailForTests } from "~/lib/home-bounds-store";
import {
  buildHomeBoundsDetail,
  geographicBoundsFromMapCanvas,
  publishHomeMapBounds,
  resetHomeMapBoundsPublishForTests,
} from "~/lib/home-map-bounds-publish";
import { countHomeNearbyPlaces } from "~/lib/home-nearby-count";
import type { NavCatalog, NavSpot } from "~/lib/pilgrimage-nav";

function spot(id: string, lng: number, lat: number): NavSpot {
  return {
    id,
    subjectId: "s1",
    locationSlug: "test",
    lng,
    lat,
    name: { ja: id, zh: id, tw: id, en: id },
  };
}

function catalogWithGrid(): NavCatalog {
  const spots: NavSpot[] = [];
  for (let i = 0; i < 20; i += 1) {
    for (let j = 0; j < 20; j += 1) {
      spots.push(spot(`s-${i}-${j}`, 139.45 + i * 0.005, 35.28 + j * 0.004));
    }
  }
  return { spots, animes: {} };
}


function mockMapWithCorners(corners: {
  nw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
  sw: { lng: number; lat: number };
  se: { lng: number; lat: number };
}) {
  const mapSetPadding = vi.fn();
  const cloneSetPadding = vi.fn();
  const moveendHandlers: Array<() => void> = [];
  const width = 390;
  const height = 420;
  const screenPointToLocation = (point: { x: number; y: number }) => {
    if (point.x === 0 && point.y === 0) return corners.nw;
    if (point.x === width && point.y === 0) return corners.ne;
    if (point.x === 0 && point.y === height) return corners.sw;
    if (point.x === width && point.y === height) return corners.se;
    return { lat: 35.3, lng: 139.481 };
  };
  return {
    map: {
      getPadding: () => ({ top: 0, bottom: 200, left: 24, right: 24 }),
      setPadding: mapSetPadding,
      on: (event: string, handler: () => void) => {
        if (event === "moveend") moveendHandlers.push(handler);
      },
      getContainer: () => ({ clientWidth: width, clientHeight: height }),
      unproject: (point: [number, number]) => {
        const [x, y] = point;
        if (x === 0 && y === 0) return corners.nw;
        if (x === width && y === 0) return corners.ne;
        if (x === 0 && y === height) return corners.sw;
        if (x === width && y === height) return corners.se;
        return { lat: 35.3, lng: 139.481 };
      },
      transform: {
        clone: () => ({
          setPadding: cloneSetPadding,
          width,
          height,
          screenPointToLocation,
        }),
      },
      getBounds: () => ({
        getWest: () => 139.47,
        getSouth: () => 35.29,
        getEast: () => 139.49,
        getNorth: () => 35.31,
      }),
      getCenter: () => ({ lat: 35.3, lng: 139.481 }),
    },
    mapSetPadding,
    moveendHandlers,
  };
}

describe("locate nearby count with sheet padding", () => {
  it("keeps count when republishing a locked locate snapshot after sheet padding", () => {
    const catalog = catalogWithGrid();
    const wideCorners = {
      nw: { lng: 139.42, lat: 35.36 },
      ne: { lng: 139.56, lat: 35.36 },
      sw: { lng: 139.42, lat: 35.24 },
      se: { lng: 139.56, lat: 35.24 },
    };
    const locateMap = mockMapWithCorners(wideCorners).map;
    const afterLocate = buildHomeBoundsDetail(locateMap as never);
    const beforeOpen = countHomeNearbyPlaces(catalog, afterLocate, {
      subjectId: null,
    }).inView;

    const tightCorners = {
      nw: { lng: 139.47, lat: 35.32 },
      ne: { lng: 139.5, lat: 35.32 },
      sw: { lng: 139.47, lat: 35.28 },
      se: { lng: 139.5, lat: 35.28 },
    };
    const sheetMap = mockMapWithCorners(tightCorners).map;
    const afterSheetLive = countHomeNearbyPlaces(
      catalog,
      buildHomeBoundsDetail(sheetMap as never),
      { subjectId: null },
    ).inView;
    const afterSheetLocked = countHomeNearbyPlaces(catalog, afterLocate, {
      subjectId: null,
    }).inView;

    expect(beforeOpen).toBeGreaterThan(afterSheetLive);
    expect(afterSheetLocked).toBe(beforeOpen);
  });

  it("does not call setPadding or recurse when publishing on moveend", () => {
    resetHomeMapBoundsPublishForTests();
    resetLatestHomeBoundsDetailForTests();
    const wideCorners = {
      nw: { lng: 139.42, lat: 35.36 },
      ne: { lng: 139.56, lat: 35.36 },
      sw: { lng: 139.42, lat: 35.24 },
      se: { lng: 139.56, lat: 35.24 },
    };
    const { map, mapSetPadding, moveendHandlers } = mockMapWithCorners(wideCorners);
    let publishCount = 0;
    const handler = () => {
      publishCount += 1;
      publishHomeMapBounds(map as never);
    };
    moveendHandlers.push(handler);
    handler();
    expect(mapSetPadding).not.toHaveBeenCalled();
    expect(publishCount).toBe(1);
  });

  it("uses the same detail shape for locked republish", () => {
    const corners = {
      nw: { lng: 139.42, lat: 35.36 },
      ne: { lng: 139.56, lat: 35.36 },
      sw: { lng: 139.42, lat: 35.24 },
      se: { lng: 139.56, lat: 35.24 },
    };
    const map = mockMapWithCorners(corners).map;
    const detail: HomeBoundsDetail = buildHomeBoundsDetail(map as never);
    expect(detail.west).toBe(139.42);
    expect(detail.east).toBe(139.56);
    expect(geographicBoundsFromMapCanvas(map as never)).toEqual({
      west: 139.42,
      south: 35.24,
      east: 139.56,
      north: 35.36,
    });
  });
});
