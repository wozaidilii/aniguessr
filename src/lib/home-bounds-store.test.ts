import { afterEach, describe, expect, it } from "vitest";
import {
  publishHomeBoundsDetail,
  readLatestHomeBoundsDetail,
  resetLatestHomeBoundsDetailForTests,
} from "~/lib/home-bounds-store";

const sampleBounds = {
  lat: 35.6,
  lng: 139.7,
  north: 35.7,
  south: 35.5,
  east: 139.8,
  west: 139.6,
};

describe("home-bounds-store", () => {
  afterEach(() => {
    resetLatestHomeBoundsDetailForTests();
  });

  it("retains the latest bounds for late subscribers", () => {
    publishHomeBoundsDetail(sampleBounds);
    expect(readLatestHomeBoundsDetail()).toEqual(sampleBounds);
  });

  it("replays after catalog arrives following an early publish", () => {
    publishHomeBoundsDetail(sampleBounds);
    const replay = readLatestHomeBoundsDetail();
    expect(replay).toEqual(sampleBounds);
    publishHomeBoundsDetail({ ...sampleBounds, lat: 35.61 });
    expect(readLatestHomeBoundsDetail()?.lat).toBe(35.61);
  });
});
