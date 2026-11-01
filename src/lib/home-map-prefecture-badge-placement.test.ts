import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import {
  badgeRectAt,
  placeAreaBadgeCenters,
  placePrefectureBadgeCenters,
  PREFECTURE_BADGE_OFFSET_MAX_PX,
  type AxisRect,
  type AreaBadgePlacementInput,
} from "~/lib/home-map-area-badge-format";

const labels = JSON.parse(
  readFileSync("public/data/seo/home-map-labels.json", "utf8"),
) as HomeMapLabels;

const JAPAN_PREF_DESKTOP = {
  width: 1440,
  height: 900,
  center: [138.5, 36.5] as [number, number],
};

const JAPAN_PREF_MOBILE = {
  width: 390,
  height: 844,
  center: [136, 37] as [number, number],
};

function lngLatToPixel(
  lng: number,
  lat: number,
  zoom: number,
  centerLng: number,
  centerLat: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const worldSize = 512 * 2 ** zoom;
  const projectLng = (value: number) => ((value + 180) / 360) * worldSize;
  const projectLat = (value: number) => {
    const sin = Math.sin((value * Math.PI) / 180);
    return (0.5 - (0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI) * worldSize;
  };
  return {
    x: projectLng(lng) - projectLng(centerLng) + width / 2,
    y: projectLat(lat) - projectLat(centerLat) + height / 2,
  };
}

function prefectureCandidates(
  width: number,
  height: number,
  zoom: number,
  center: [number, number],
): AreaBadgePlacementInput[] {
  return labels.prefectures.map((pref) => {
    const point = lngLatToPixel(
      pref.lng,
      pref.lat,
      zoom,
      center[0],
      center[1],
      width,
      height,
    );
    return { id: pref.id, count: pref.count, x: point.x, y: point.y };
  });
}

function viewportInset(width: number, height: number, margin = 4): AxisRect {
  return {
    left: margin,
    top: margin,
    right: width - margin,
    bottom: height - margin,
  };
}

function rectsOverlap(a: AxisRect, b: AxisRect, gap: number): boolean {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

function assertPlacedValid(
  placed: readonly AreaBadgePlacementInput[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap = 3,
): void {
  const rects = placed.map((item) =>
    badgeRectAt(item.x, item.y, item.count),
  );
  for (const rect of rects) {
    expect(rect.left).toBeGreaterThanOrEqual(viewport.left);
    expect(rect.top).toBeGreaterThanOrEqual(viewport.top);
    expect(rect.right).toBeLessThanOrEqual(viewport.right);
    expect(rect.bottom).toBeLessThanOrEqual(viewport.bottom);
    for (const obstacle of obstacles) {
      expect(rectsOverlap(rect, obstacle, gap)).toBe(false);
    }
  }
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      expect(rectsOverlap(rects[i]!, rects[j]!, gap)).toBe(false);
    }
  }
}

function osakaAnchorOnScreen(
  candidates: readonly AreaBadgePlacementInput[],
  viewport: AxisRect,
): boolean {
  const osaka = candidates.find((item) => item.id === "osaka");
  if (!osaka) return false;
  const rect = badgeRectAt(osaka.x, osaka.y, osaka.count);
  return (
    rect.bottom >= viewport.top &&
    rect.top <= viewport.bottom &&
    rect.right >= viewport.left &&
    rect.left <= viewport.right
  );
}

describe("placePrefectureBadgeCenters", () => {
  it("snaps near-viewport pins after outward search", () => {
    const viewport = { left: 0, top: 0, right: 120, bottom: 100 };
    const placed = placePrefectureBadgeCenters(
      [{ id: "edge", count: 40, x: 2, y: 50 }],
      [],
      viewport,
    );
    expect(placed).toHaveLength(1);
    expect(placed[0]?.x).toBeGreaterThan(10);
  });

  it("pairs Osaka and Kyoto with Kyoto above Osaka when they collide", () => {
    const viewport = { left: 0, top: 0, right: 800, bottom: 800 };
    const kyoto = { id: "kyoto", count: 1687, x: 400, y: 400 };
    const osaka = { id: "osaka", count: 235, x: 418, y: 424 };
    const placed = placePrefectureBadgeCenters([kyoto, osaka], [], viewport);
    const osakaPlaced = placed.find((item) => item.id === "osaka");
    const kyotoPlaced = placed.find((item) => item.id === "kyoto");
    expect(osakaPlaced).toBeDefined();
    expect(kyotoPlaced).toBeDefined();
    expect(kyotoPlaced!.y).toBeLessThanOrEqual(kyoto.y);
    expect(osakaPlaced!.y).toBeGreaterThanOrEqual(osaka.y);
  });

  it("does not change area-level placement behaviour", () => {
    const viewport = { left: 0, top: 0, right: 400, bottom: 400 };
    const candidates = [
      { id: "a", count: 10, x: 100, y: 100 },
      { id: "b", count: 500, x: 105, y: 100 },
    ];
    expect(placeAreaBadgeCenters(candidates, [], viewport)).toEqual([
      { id: "b", count: 500, x: 105, y: 100 },
    ]);
  });
});

describe("Osaka prefecture badge at Japan overview zooms", () => {
  const zooms = [4.5, 5.5, 6.5, 6.9] as const;

  it("shows Osaka on desktop without collisions", () => {
    const { width, height, center } = JAPAN_PREF_DESKTOP;
    const viewport = viewportInset(width, height);
    for (const zoom of zooms) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      expect(osakaAnchorOnScreen(candidates, viewport)).toBe(true);
      const placed = placePrefectureBadgeCenters(candidates, [], viewport);
      const osaka = placed.find((item) => item.id === "osaka");
      expect(osaka, `missing at zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, viewport, []);
    }
  });

  it("shows Osaka on mobile without collisions when the pin is on screen", () => {
    const { width, height, center } = JAPAN_PREF_MOBILE;
    const viewport = viewportInset(width, height);
    for (const zoom of zooms) {
      if (zoom > 6.5) continue;
      const candidates = prefectureCandidates(width, height, zoom, center);
      expect(osakaAnchorOnScreen(candidates, viewport)).toBe(true);
      const placed = placePrefectureBadgeCenters(candidates, [], viewport);
      const osaka = placed.find((item) => item.id === "osaka");
      expect(osaka, `missing at zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, viewport, []);
    }
  });

  it("uses 14px outward search before Osaka/Kyoto pairing", () => {
    expect(PREFECTURE_BADGE_OFFSET_MAX_PX).toBe(14);
  });
});
