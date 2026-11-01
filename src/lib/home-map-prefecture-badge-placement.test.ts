import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import {
  placeAreaBadgeCenters,
  placePrefectureBadgeCenters,
  prefectureBadgeRectAt,
  prefecturePinInVisibleMap,
  PREFECTURE_BADGE_GAP,
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

const MOBILE_SHEET_HEIGHT = 372;

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

function mobile390Obstacles(width: number, height: number): AxisRect[] {
  return [
    {
      left: 0,
      top: height - MOBILE_SHEET_HEIGHT,
      right: width,
      bottom: height,
    },
    {
      left: 0,
      top: height - 28,
      right: 120,
      bottom: height,
    },
  ];
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
  pinsById: ReadonlyMap<string, { x: number; y: number }>,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap = PREFECTURE_BADGE_GAP,
): void {
  const rects = placed.map((item) =>
    prefectureBadgeRectAt(item.x, item.y, item.count),
  );
  for (const item of placed) {
    const pin = pinsById.get(item.id);
    expect(pin, `missing pin for ${item.id}`).toBeDefined();
    expect(
      Math.abs(item.x - pin!.x) + Math.abs(item.y - pin!.y),
    ).toBeLessThanOrEqual(
      item.id === "kyoto" || item.id === "osaka"
        ? 32
        : PREFECTURE_BADGE_OFFSET_MAX_PX,
    );
  }
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

function osakaPinOnMap(
  candidates: readonly AreaBadgePlacementInput[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
): boolean {
  const osaka = candidates.find((item) => item.id === "osaka");
  if (!osaka) return false;
  return prefecturePinInVisibleMap(osaka.x, osaka.y, viewport, obstacles);
}

describe("placePrefectureBadgeCenters", () => {
  it("does not place badges when the geographic pin is off-screen", () => {
    const viewport = { left: 0, top: 0, right: 120, bottom: 100 };
    const placed = placePrefectureBadgeCenters(
      [{ id: "edge", count: 40, x: -20, y: 50 }],
      [],
      viewport,
    );
    expect(placed).toHaveLength(0);
  });

  it("does not snap off-screen pins into the viewport", () => {
    const viewport = { left: 0, top: 0, right: 400, bottom: 400 };
    const placed = placePrefectureBadgeCenters(
      [{ id: "okinawa", count: 120, x: -50, y: 200 }],
      [],
      viewport,
    );
    expect(placed).toHaveLength(0);
  });

  it("pairs Osaka and Kyoto with Kyoto above Osaka when they collide", () => {
    const viewport = { left: 0, top: 0, right: 800, bottom: 800 };
    const kyoto = { id: "kyoto", count: 1687, x: 400, y: 400 };
    const osaka = { id: "osaka", count: 235, x: 405, y: 418 };
    const blocker = { id: "nara", count: 80, x: 402, y: 410 };
    const placed = placePrefectureBadgeCenters(
      [kyoto, osaka, blocker],
      [],
      viewport,
    );
    const osakaPlaced = placed.find((item) => item.id === "osaka");
    const kyotoPlaced = placed.find((item) => item.id === "kyoto");
    expect(osakaPlaced).toBeDefined();
    expect(kyotoPlaced).toBeDefined();
    expect(kyotoPlaced!.y).toBeLessThan(kyoto.y);
    expect(osakaPlaced!.y).toBeGreaterThan(osaka.y);
  });

  it("rejects candidate positions that intersect UI obstacles", () => {
    const viewport = { left: 0, top: 0, right: 400, bottom: 400 };
    const obstacle = { left: 180, top: 180, right: 260, bottom: 220 };
    const placed = placePrefectureBadgeCenters(
      [{ id: "fukuoka", count: 400, x: 220, y: 200 }],
      [obstacle],
      viewport,
    );
    expect(placed).toHaveLength(0);
  });

  it("does not place badges when the pin sits under a UI obstacle such as the sheet", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const placed = placePrefectureBadgeCenters(
      [{ id: "osaka", count: 235, x: 120, y: 600 }],
      obstacles,
      viewport,
    );
    expect(placed).toHaveLength(0);
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
  const zooms = [4.5, 5, 5.5, 6, 6.5, 6.9] as const;

  it("shows Osaka on desktop without collisions", () => {
    const { width, height, center } = JAPAN_PREF_DESKTOP;
    const viewport = viewportInset(width, height);
    for (const zoom of zooms) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      expect(osakaPinOnMap(candidates, viewport, [])).toBe(true);
      const pins = new Map(candidates.map((c) => [c.id, { x: c.x, y: c.y }]));
      const placed = placePrefectureBadgeCenters(candidates, [], viewport);
      const osaka = placed.find((item) => item.id === "osaka");
      expect(osaka, `missing at zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, pins, viewport, []);
    }
  });

  it("shows Osaka on mobile 390 when the pin is on screen above the sheet", () => {
    const { width, height, center } = JAPAN_PREF_MOBILE;
    const viewport = viewportInset(width, height);
    const obstacles = mobile390Obstacles(width, height);
    for (const zoom of zooms) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      if (!osakaPinOnMap(candidates, viewport, obstacles)) continue;
      const pins = new Map(candidates.map((c) => [c.id, { x: c.x, y: c.y }]));
      const placed = placePrefectureBadgeCenters(candidates, obstacles, viewport);
      const osaka = placed.find((item) => item.id === "osaka");
      expect(osaka, `missing at zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, pins, viewport, obstacles);
    }
  });

  it("keeps Osaka at zoom 6.0–6.5 when the pin sits at lower-left above the sheet", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const crowd = labels.prefectures
      .filter((pref) => !["osaka", "kyoto", "nara", "okayama"].includes(pref.id))
      .slice(0, 12)
      .map((pref, index) => ({
        id: pref.id,
        count: pref.count,
        x: 120 + (index % 4) * 36,
        y: 360 + Math.floor(index / 4) * 36,
      }));
    const kyoto = { id: "kyoto", count: 1687, x: 130, y: 420 };
    const osaka = { id: "osaka", count: 235, x: 98, y: 448 };
    for (const zoom of [6, 6.5] as const) {
      void zoom;
      const candidates = [kyoto, osaka, ...crowd];
      const pins = new Map(candidates.map((c) => [c.id, { x: c.x, y: c.y }]));
      const placed = placePrefectureBadgeCenters(candidates, obstacles, viewport);
      expect(placed.find((item) => item.id === "osaka"), `zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, pins, viewport, obstacles);
    }
  });

  it("keeps Osaka when the pin is near the visible map bottom above the sheet", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const osaka = { id: "osaka", count: 235, x: 195, y: 458 };
    const kyoto = { id: "kyoto", count: 1687, x: 188, y: 420 };
    const crowd = labels.prefectures
      .filter((pref) => !["osaka", "kyoto"].includes(pref.id))
      .slice(0, 8)
      .map((pref, index) => ({
        id: pref.id,
        count: pref.count,
        x: 240 + index * 8,
        y: 360 + index * 10,
      }));
    for (const zoom of [5, 5.5, 6, 6.5] as const) {
      void zoom;
      const candidates = [kyoto, osaka, ...crowd];
      const pins = new Map(candidates.map((c) => [c.id, { x: c.x, y: c.y }]));
      const placed = placePrefectureBadgeCenters(candidates, obstacles, viewport);
      expect(placed.find((item) => item.id === "osaka"), `zoom ${zoom}`).toBeDefined();
      assertPlacedValid(placed, pins, viewport, obstacles);
    }
  });

  it("uses 14px outward search before Osaka/Kyoto pairing", () => {
    expect(PREFECTURE_BADGE_OFFSET_MAX_PX).toBe(14);
    expect(PREFECTURE_BADGE_GAP).toBe(2);
  });
});
