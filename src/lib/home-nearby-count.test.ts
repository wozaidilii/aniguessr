import { describe, expect, it } from "vitest";
import {
  publishHomeBoundsDetail,
  readLatestHomeBoundsDetail,
  resetLatestHomeBoundsDetailForTests,
} from "~/lib/home-bounds-store";
import { countHomeNearbyPlaces } from "~/lib/home-nearby-count";
import type { NavCatalog } from "~/lib/pilgrimage-nav";

const bounds = {
  lat: 35.31,
  lng: 139.55,
  north: 35.35,
  south: 35.27,
  east: 139.6,
  west: 139.5,
};

const catalog = {
  spots: [
    {
      id: "a",
      subjectId: "s1",
      lat: 35.32,
      lng: 139.56,
      name: "A",
    },
    {
      id: "b",
      subjectId: "s2",
      lat: 35.33,
      lng: 139.57,
      name: "B",
    },
  ],
} as unknown as NavCatalog;

describe("countHomeNearbyPlaces", () => {
  it("counts clustered places in view", () => {
    const { inView } = countHomeNearbyPlaces(catalog, bounds, {
      subjectId: null,
    });
    expect(inView).toBe(2);
  });

  it("catalog-arrives-after-first-bounds can paint from replayed store", () => {
    resetLatestHomeBoundsDetailForTests();
    publishHomeBoundsDetail(bounds);
    const replay = readLatestHomeBoundsDetail();
    expect(replay).toEqual(bounds);
    const { inView } = countHomeNearbyPlaces(catalog, replay!, {
      subjectId: null,
    });
    expect(inView).toBe(2);
    resetLatestHomeBoundsDetailForTests();
  });
});
