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

const locateCenter = { lat: 35.3, lng: 139.481 };

function mockMapWithCorners(corners: {
  nw: { lng: number; lat: number };
  ne: { lng: number; lat: number };
  sw: { lng: number; lat: number };
  se: { lng: number; lat: number };
}) {
  const setPadding = vi.fn();
  const moveendHandlers: Array<() => void> = [];
  return {
    map: {
      getPadding: () => ({ top: 0, bottom: 200, left: 24, right: 24 }),
      setPadding,
      on: (event: string, handler: () => void) => {
        if (event === "moveend") moveendHandlers.push(handler);
      },
      getContainer: () => ({ clientWidth: 390, clientHeight: 420 }),
      unproject: (point: [number, number]) => {
        const [x, y] = point;
        const width = 390;
        const height = 420;
        if (x === 0 && y === 0) return corners.nw;
        if (x === width && y === 0) return corners.ne;
        if (x === 0 && y === height) return corners.sw;
        if (x === width && y === height) return corners.se;
        return locateCenter;
      },
      getBounds: () => ({
        getWest: () => 139.47,
        getSouth: () => 35.29,
        getEast: () => 139.49,
        getNorth: () => 35.31,
      }),
      getCenter: () => locateCenter,
    },
    setPadding,
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
    const { map, setPadding, moveendHandlers } = mockMapWithCorners(wideCorners);
    let publishCount = 0;
    const handler = () => {
      publishCount += 1;
      publishHomeMapBounds(map as never);
    };
    moveendHandlers.push(handler);
    handler();
    expect(setPadding).not.toHaveBeenCalled();
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
