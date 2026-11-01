import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import { HOME_MAP_AREA_BADGE_MIN_ZOOM } from "~/lib/home-map-area-badge-format";
import {
  prefectureFocusZoom,
  prefectureZoomBounds,
} from "~/lib/home-map-prefecture-zoom";

const labels = JSON.parse(
  readFileSync("public/data/seo/home-map-labels.json", "utf8"),
) as HomeMapLabels;

describe("prefectureZoomBounds", () => {
  it("frames Tokyo mainland without Ogasawara pulling the bbox south", () => {
    const tokyo = labels.prefectures.find((item) => item.id === "tokyo");
    expect(tokyo).toBeDefined();
    const bounds = prefectureZoomBounds(tokyo!.id, labels.areas, tokyo!);
    expect(bounds.south).toBeGreaterThan(35);
    expect(bounds.north).toBeLessThan(36);
  });

  it("returns sensible boxes for Kyoto, Hokkaido, and Okinawa", () => {
    for (const id of ["kyoto", "hokkaido", "okinawa"] as const) {
      const pref = labels.prefectures.find((item) => item.id === id);
      expect(pref).toBeDefined();
      const bounds = prefectureZoomBounds(pref!.id, labels.areas, pref!);
      expect(bounds.east).toBeGreaterThan(bounds.west);
      expect(bounds.north).toBeGreaterThan(bounds.south);
    }
  });
});

describe("prefectureFocusZoom", () => {
  it("never ends below the area-badge zoom threshold", () => {
    expect(prefectureFocusZoom(5.3)).toBe(HOME_MAP_AREA_BADGE_MIN_ZOOM);
    expect(prefectureFocusZoom(8.2)).toBe(8.2);
  });
});
