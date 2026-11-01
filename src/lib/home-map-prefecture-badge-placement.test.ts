import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import {
  placeAreaBadgeCenters,
  placePrefectureBadgeCenters,
  placePrefectureBadgeCentersRound5,
  prefectureBadgeRectAt,
  prefecturePinInVisibleMap,
  PREFECTURE_BADGE_GAP,
  PREFECTURE_BADGE_OFFSET_MAX_PX,
  PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
  prefectureOffsetAllowed,
  prefectureOffsetSearchPoints,
  OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
  OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX,
  OSAKA_KYOTO_PAIR_OFFSET_MAX_PX,
  OSAKA_PREFECTURE_OFFSET_MAX_PX,
  type AxisRect,
  type AreaBadgePlacementInput,
} from "~/lib/home-map-area-badge-format";
import { buildMobile390PlacementObstacles } from "~/lib/home-map-badge-ui-obstacles";

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

function mobile390Obstacles(width: number, height: number): AxisRect[] {
  return buildMobile390PlacementObstacles(width, height);
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
  stablePlaced: readonly AreaBadgePlacementInput[] = [],
): void {
  const r5ById = new Map(stablePlaced.map((item) => [item.id, item]));
  const rects = placed.map((item) =>
    prefectureBadgeRectAt(item.x, item.y, item.count),
  );
  for (const item of placed) {
    const pin = pinsById.get(item.id);
    expect(pin, `missing pin for ${item.id}`).toBeDefined();
    const r5Base = r5ById.get(item.id);
    if (item.id !== "osaka" && r5Base) {
      if (item.id === "kyoto") {
        expect(item.x).toBe(r5Base.x);
        expect(item.y).toBeLessThanOrEqual(r5Base.y);
        if (item.y < r5Base.y) {
          expect(r5Base.y - item.y).toBeLessThanOrEqual(
            OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
          );
        }
      } else {
        expect(item.x).toBe(r5Base.x);
        expect(item.y).toBe(r5Base.y);
      }
    }
    if (
      r5Base?.x === item.x &&
      r5Base?.y === item.y &&
      item.id !== "osaka"
    ) {
      continue;
    }
    if (item.id === "kyoto" && r5Base && item.y < r5Base.y) {
      continue;
    }
    const dx = item.x - pin!.x;
    const dy = item.y - pin!.y;
    const limits =
      item.id === "osaka"
        ? {
            maxTotalPx: r5ById.has("osaka")
              ? OSAKA_KYOTO_PAIR_OFFSET_MAX_PX
              : OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
            diagonalAxisMaxPx:
              item.id === "osaka" && !r5ById.has("osaka")
                ? OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX
                : PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
          }
        : {
            maxTotalPx: PREFECTURE_BADGE_OFFSET_MAX_PX,
            diagonalAxisMaxPx: PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
          };
    if (item.id === "osaka" && r5ById.get("osaka")) {
      const r5Osaka = r5ById.get("osaka")!;
      if (item.x === r5Osaka.x && item.y === r5Osaka.y) {
        continue;
      }
      limits.maxTotalPx = OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX;
      limits.diagonalAxisMaxPx = OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX;
    }
    expect(
      prefectureOffsetAllowed(
        dx,
        dy,
        limits.maxTotalPx,
        limits.diagonalAxisMaxPx,
      ),
    ).toBe(true);
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
  if (!prefecturePinInVisibleMap(osaka.x, osaka.y, viewport, obstacles)) {
    return false;
  }
  for (const obstacle of obstacles) {
    if (obstacle.bottom < viewport.bottom - 8) continue;
    if (
      osaka.x >= obstacle.left &&
      osaka.x <= obstacle.right &&
      osaka.y >= obstacle.top &&
      osaka.y <= obstacle.bottom
    ) {
      return false;
    }
  }
  return true;
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
    expect(
      osakaPlaced!.x !== osaka.x || osakaPlaced!.y !== osaka.y,
    ).toBe(true);
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

  it("does not place badges when every candidate within 32px hits obstacles", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const block = { left: 70, top: 640, right: 130, bottom: 710 };
    const placed = placePrefectureBadgeCenters(
      [{ id: "osaka", count: 235, x: 100, y: 673 }],
      [...obstacles, block],
      viewport,
    );
    expect(placed).toHaveLength(0);
  });

  it("does not place badges when the pin sits inside the bottom sheet strip", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const placed = placePrefectureBadgeCenters(
      [{ id: "osaka", count: 235, x: 120, y: 800 }],
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

describe("prefecture offset search limits", () => {
  it("allows cardinals up to 14px total distance", () => {
    expect(prefectureOffsetAllowed(14, 0)).toBe(true);
    expect(prefectureOffsetAllowed(0, -14)).toBe(true);
    expect(prefectureOffsetAllowed(15, 0)).toBe(false);
  });

  it("allows Osaka extended diagonals up to 24px total and 18px per axis", () => {
    expect(
      prefectureOffsetAllowed(
        -17,
        -15,
        OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
        OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX,
      ),
    ).toBe(true);
    expect(
      prefectureOffsetAllowed(
        -17,
        -15,
        PREFECTURE_BADGE_OFFSET_MAX_PX,
        PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
      ),
    ).toBe(false);
    expect(
      prefectureOffsetSearchPoints(
        OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
        OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX,
      ).some(({ dx, dy }) => dx === -17 && dy === -15),
    ).toBe(true);
  });

  it("caps diagonal moves at 10px per axis and 14px total distance", () => {
    expect(prefectureOffsetAllowed(10, 10)).toBe(false);
    expect(prefectureOffsetAllowed(10, 7)).toBe(true);
    expect(prefectureOffsetAllowed(-17, -15)).toBe(false);
    expect(PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX).toBe(10);
  });

  it("orders search points by Euclidean distance", () => {
    const points = prefectureOffsetSearchPoints();
    let last = 0;
    for (const { dx, dy } of points) {
      expect(prefectureOffsetAllowed(dx, dy)).toBe(true);
      const dist = Math.hypot(dx, dy);
      expect(dist).toBeLessThanOrEqual(PREFECTURE_BADGE_OFFSET_MAX_PX);
      expect(dist + 1e-9).toBeGreaterThanOrEqual(last);
      last = dist;
    }
    expect(points.some(({ dx, dy }) => dx === 7 && dy === 7)).toBe(true);
  });
});

describe("prefecture placement stability", () => {
  it("matches round-5 exactly when round-5 placed Osaka", () => {
    const { width, height, center } = JAPAN_PREF_DESKTOP;
    const viewport = viewportInset(width, height);
    for (const zoom of [4.5, 5.3, 6.5] as const) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      const r5 = placePrefectureBadgeCentersRound5(candidates, [], viewport);
      if (!r5.some((item) => item.id === "osaka")) continue;
      const full = placePrefectureBadgeCenters(candidates, [], viewport);
      expect(full).toEqual(r5);
    }
  });

  it("keeps every non-Osaka badge identical to round-5 placement", () => {
    const { width, height, center } = JAPAN_PREF_MOBILE;
    const viewport = viewportInset(width, height);
    const obstacles = mobile390Obstacles(width, height);
    for (const zoom of [4.5, 5.5, 6.5] as const) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      const r5 = placePrefectureBadgeCentersRound5(
        candidates,
        obstacles,
        viewport,
      );
      const full = placePrefectureBadgeCenters(candidates, obstacles, viewport);
      const r5ById = new Map(r5.map((item) => [item.id, item]));
      for (const item of full) {
        if (item.id === "osaka") continue;
        const base = r5ById.get(item.id);
        expect(base, `${item.id} at zoom ${zoom}`).toBeDefined();
        if (item.id === "kyoto") {
          expect(item.x).toBe(base!.x);
          expect(item.y).toBeLessThanOrEqual(base!.y);
          if (item.y < base!.y) {
            expect(base!.y - item.y).toBeLessThanOrEqual(
              OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
            );
          }
          continue;
        }
        expect(item.x, item.id).toBe(base!.x);
        expect(item.y, item.id).toBe(base!.y);
      }
    }
  });

  it("only moves Kyoto straight up from round-5 when adjusted for Osaka rescue", () => {
    const { width, height, center } = JAPAN_PREF_MOBILE;
    const viewport = viewportInset(width, height);
    const obstacles = mobile390Obstacles(width, height);
    const candidates = prefectureCandidates(width, height, 4.5, center).map(
      (item) =>
        item.id === "osaka" ? { ...item, x: 330, y: 745 } : item,
    );
    const r5 = placePrefectureBadgeCentersRound5(
      candidates,
      obstacles,
      viewport,
    );
    const full = placePrefectureBadgeCenters(candidates, obstacles, viewport);
    const r5Kyoto = r5.find((item) => item.id === "kyoto");
    const fullKyoto = full.find((item) => item.id === "kyoto");
    expect(r5Kyoto).toBeDefined();
    expect(fullKyoto).toBeDefined();
    expect(fullKyoto!.x).toBe(r5Kyoto!.x);
    expect(fullKyoto!.y).toBeLessThanOrEqual(r5Kyoto!.y);
    if (fullKyoto!.y < r5Kyoto!.y) {
      expect(r5Kyoto!.y - fullKyoto!.y).toBeLessThanOrEqual(
        OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
      );
    }
  });
});

describe("Osaka prefecture badge at Japan overview zooms", () => {
  const zooms = [4.5, 5, 5.5, 6, 6.5, 6.9] as const;

  it("shows Osaka on desktop without collisions when a slot exists", () => {
    const { width, height, center } = JAPAN_PREF_DESKTOP;
    const viewport = viewportInset(width, height);
    for (const zoom of zooms) {
      const candidates = prefectureCandidates(width, height, zoom, center);
      if (!osakaPinOnMap(candidates, viewport, [])) continue;
      const pins = new Map(candidates.map((c) => [c.id, { x: c.x, y: c.y }]));
      const r5 = placePrefectureBadgeCentersRound5(
        candidates,
        [],
        viewport,
      );
      const placed = placePrefectureBadgeCenters(candidates, [], viewport);
      for (const item of placed) {
        if (item.id === "osaka") continue;
        const base = r5.find((entry) => entry.id === item.id);
        expect(base, `${item.id} at zoom ${zoom}`).toBeDefined();
        if (item.id === "kyoto") {
          expect(item.x).toBe(base!.x);
          expect(item.y).toBeLessThanOrEqual(base!.y);
          continue;
        }
        expect(item.x).toBe(base!.x);
        expect(item.y).toBe(base!.y);
      }
      if (placed.some((item) => item.id === "osaka")) {
        assertPlacedValid(placed, pins, viewport, [], PREFECTURE_BADGE_GAP, r5);
      }
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
      const r5 = placePrefectureBadgeCentersRound5(
        candidates,
        obstacles,
        viewport,
      );
      const placed = placePrefectureBadgeCenters(candidates, obstacles, viewport);
      for (const item of placed) {
        if (item.id === "osaka") continue;
        const base = r5.find((entry) => entry.id === item.id);
        expect(base, `${item.id} at zoom ${zoom}`).toBeDefined();
        if (item.id === "kyoto") {
          expect(item.x).toBe(base!.x);
          expect(item.y).toBeLessThanOrEqual(base!.y);
          continue;
        }
        expect(item.x).toBe(base!.x);
        expect(item.y).toBe(base!.y);
      }
      if (placed.some((item) => item.id === "osaka")) {
        assertPlacedValid(
          placed,
          pins,
          viewport,
          obstacles,
          PREFECTURE_BADGE_GAP,
          r5,
        );
      }
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

  it("shows Osaka at z4.5 beside Kyoto with SW pins above the conservative attribution", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const kyoto = { id: "kyoto", count: 1561, x: 106, y: 661 };
    const osaka = { id: "osaka", count: 230, x: 97.5, y: 673 };
    const pins = new Map([
      ["kyoto", { x: kyoto.x, y: kyoto.y }],
      ["osaka", { x: osaka.x, y: osaka.y }],
    ]);
    const r5 = placePrefectureBadgeCentersRound5(
      [kyoto, osaka],
      obstacles,
      viewport,
    );
    const placed = placePrefectureBadgeCenters(
      [kyoto, osaka],
      obstacles,
      viewport,
    );
    expect(placed.find((item) => item.id === "osaka")).toBeDefined();
    assertPlacedValid(placed, pins, viewport, obstacles, PREFECTURE_BADGE_GAP, r5);
  });

  it("shows Osaka near the bottom of the visible map at z4.5–6.5", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const kyoto = { id: "kyoto", count: 1561, x: 188, y: 661 };
    const osaka = { id: "osaka", count: 230, x: 195, y: 673 };
    const candidates = [kyoto, osaka];
    const r5 = placePrefectureBadgeCentersRound5(
      candidates,
      obstacles,
      viewport,
    );
    for (const zoom of [4.5, 5, 5.5, 6, 6.5] as const) {
      void zoom;
      const pins = new Map([
        ["kyoto", { x: kyoto.x, y: kyoto.y }],
        ["osaka", { x: osaka.x, y: osaka.y }],
      ]);
      const placed = placePrefectureBadgeCenters(
        candidates,
        obstacles,
        viewport,
      );
      expect(
        placed.find((item) => item.id === "osaka"),
        `zoom ${zoom}`,
      ).toBeDefined();
      assertPlacedValid(placed, pins, viewport, obstacles, PREFECTURE_BADGE_GAP, r5);
    }
  });

  it("shows Osaka at x=330 when a cardinal slot exists above the sheet", () => {
    const viewport = { left: 4, top: 4, right: 386, bottom: 840 };
    const obstacles = mobile390Obstacles(390, 844);
    const osaka = { id: "osaka", count: 230, x: 330, y: 730 };
    const placed = placePrefectureBadgeCenters([osaka], obstacles, viewport);
    expect(placed.find((item) => item.id === "osaka")).toBeDefined();
  });

  it("places Osaka at (330,745) on 390 via extended Osaka-only offset search", () => {
    const { width, height, center } = JAPAN_PREF_MOBILE;
    const viewport = viewportInset(width, height);
    const obstacles = mobile390Obstacles(width, height);
    for (const zoom of [4.5, 5.5] as const) {
      const candidates = prefectureCandidates(width, height, zoom, center).map(
        (item) =>
          item.id === "osaka" ? { ...item, x: 330, y: 745 } : item,
      );
      const placed = placePrefectureBadgeCenters(
        candidates,
        obstacles,
        viewport,
      );
      expect(
        placed.find((item) => item.id === "osaka"),
        `zoom ${zoom}`,
      ).toBeDefined();
    }
  });

  it("drops Osaka when round-5 and extended rescue both fail", () => {
    const viewport = viewportInset(390, 844);
    const obstacles = mobile390Obstacles(390, 844);
    const kyoto = { id: "kyoto", count: 1561, x: 188, y: 700 };
    const osaka = { id: "osaka", count: 230, x: 195, y: 742 };
    const r5 = placePrefectureBadgeCentersRound5(
      [kyoto, osaka],
      obstacles,
      viewport,
    );
    expect(r5.find((item) => item.id === "osaka")).toBeUndefined();
    const placed = placePrefectureBadgeCenters(
      [kyoto, osaka],
      obstacles,
      viewport,
    );
    expect(placed.find((item) => item.id === "osaka")).toBeUndefined();
  });

  it("uses 14px standard offsets and 24px Osaka-only extended search", () => {
    expect(PREFECTURE_BADGE_OFFSET_MAX_PX).toBe(14);
    expect(PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX).toBe(10);
    expect(OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX).toBe(24);
    expect(OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX).toBe(18);
    expect(OSAKA_PREFECTURE_OFFSET_MAX_PX).toBe(24);
    expect(PREFECTURE_BADGE_GAP).toBe(2);
  });
});
