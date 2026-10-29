import { describe, expect, it } from "vitest";
import type { HomeBoundsDetail } from "~/components/home/home-events";
import {
  buildHomeBoundsDetail,
  geographicBoundsFromMapCanvas,
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

function mockMapWithPadding(
  padding: { top: number; bottom: number; left: number; right: number },
  corners: {
    nw: { lng: number; lat: number };
    ne: { lng: number; lat: number };
    sw: { lng: number; lat: number };
    se: { lng: number; lat: number };
  },
) {
  let currentPadding = { ...padding };
  return {
    getPadding: () => currentPadding,
    setPadding: (value: typeof padding) => {
      currentPadding = { ...value };
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
  };
}

describe("locate nearby count with sheet padding", () => {
  it("keeps the clustered count when sheet padding changes but canvas geography does not", () => {
    const catalog = catalogWithGrid();
    const wideCorners = {
      nw: { lng: 139.42, lat: 35.36 },
      ne: { lng: 139.56, lat: 35.36 },
      sw: { lng: 139.42, lat: 35.24 },
      se: { lng: 139.56, lat: 35.24 },
    };
    const locateMap = mockMapWithPadding(
      { top: 56, bottom: 96, left: 24, right: 24 },
      wideCorners,
    );
    const afterLocate = buildHomeBoundsDetail(locateMap as never);
    const beforeOpen = countHomeNearbyPlaces(catalog, afterLocate, {
      subjectId: null,
    }).inView;

    const sheetOpenMap = mockMapWithPadding(
      { top: 56, bottom: 280, left: 24, right: 24 },
      wideCorners,
    );
    expect(geographicBoundsFromMapCanvas(sheetOpenMap as never)).toEqual(
      geographicBoundsFromMapCanvas(locateMap as never),
    );
    const afterSheet = buildHomeBoundsDetail(sheetOpenMap as never);
    const afterOpen = countHomeNearbyPlaces(catalog, afterSheet, {
      subjectId: null,
    }).inView;

    expect(beforeOpen).toBeGreaterThan(0);
    expect(afterOpen).toBe(beforeOpen);
  });

  it("uses the same detail shape for republish after sheet open", () => {
    const corners = {
      nw: { lng: 139.42, lat: 35.36 },
      ne: { lng: 139.56, lat: 35.36 },
      sw: { lng: 139.42, lat: 35.24 },
      se: { lng: 139.56, lat: 35.24 },
    };
    const map = mockMapWithPadding(
      { top: 0, bottom: 220, left: 0, right: 0 },
      corners,
    );
    const detail: HomeBoundsDetail = buildHomeBoundsDetail(map as never);
    expect(detail.west).toBe(139.42);
    expect(detail.east).toBe(139.56);
    expect(detail.lat).toBe(locateCenter.lat);
  });
});
