import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import { placeAreaBadgeCenters } from "~/lib/home-map-area-badge-format";
import { mergePrefectureGoogleAttributionObstacle } from "~/lib/home-map-badge-ui-obstacles";

const labels = JSON.parse(
  readFileSync("public/data/seo/home-map-labels.json", "utf8"),
) as HomeMapLabels;

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

/** Measured DOM rects for area-level placement (no conservative Google merge). */
function measuredAreaObstacles(width: number, height: number) {
  const mobile = width <= 1023;
  if (mobile) {
    return [
      { left: 0, top: 0, right: width, bottom: 56 },
      { left: 0, top: height - 96, right: width, bottom: height },
      { left: 8, top: height - 150, right: 143, bottom: height - 106 },
    ];
  }
  return [
    { left: 0, top: 0, right: width, bottom: 56 },
    { left: 10, top: height - 36, right: 140, bottom: height - 8 },
  ];
}

const AREA_JA_1440 = {
  width: 1440,
  height: 900,
  zoom: 9.088,
  center: [139.63, 35.5178] as [number, number],
};

const AREA_JA_390 = {
  width: 390,
  height: 844,
  viewport: { left: 4, top: 4, right: 386, bottom: 840 },
};

function placeAtView(
  view: typeof AREA_JA_1440,
  obstacles: ReturnType<typeof measuredAreaObstacles>,
) {
  const viewport = {
    left: 4,
    top: 4,
    right: view.width - 4,
    bottom: view.height - 4,
  };
  const candidates = labels.areas.map((area) => {
    const point = lngLatToPixel(
      area.lng,
      area.lat,
      view.zoom,
      view.center[0],
      view.center[1],
      view.width,
      view.height,
    );
    return { id: area.id, count: area.count, x: point.x, y: point.y };
  });
  return placeAreaBadgeCenters(candidates, obstacles, viewport);
}

describe("placeAreaBadgeCenters prod parity", () => {
  it("still places 三島 / Mishima at 1440 with measured-style obstacles", () => {
    const placed = placeAtView(AREA_JA_1440, measuredAreaObstacles(1440, 900));
    expect(placed.some((item) => item.id === "mishima-shizuoka")).toBe(true);
  });

  it("still places 三浦 and 鋸南町 at 390 with measured-style obstacles", () => {
    const obstacles = measuredAreaObstacles(390, 844);
    const placed = placeAreaBadgeCenters(
      [
        { id: "miura-kanagawa", count: 43, x: 201, y: 693.19 },
        { id: "awa-chiba", count: 11, x: 289.38, y: 728.72 },
      ],
      obstacles,
      AREA_JA_390.viewport,
    );
    expect(placed.map((item) => item.id).sort()).toEqual([
      "awa-chiba",
      "miura-kanagawa",
    ]);
  });

  it("drops Mishima when area obstacles incorrectly use prefecture conservative merge", () => {
    const width = 1440;
    const height = 900;
    const measured = [
      {
        kind: "google" as const,
        rect: { left: 10, top: height - 36, right: 140, bottom: height - 8 },
      },
    ];
    const wrong = mergePrefectureGoogleAttributionObstacle(
      measured,
      width,
      height,
      96,
    );
    const mishima = labels.areas.find((area) => area.id === "mishima-shizuoka");
    expect(mishima).toBeDefined();
    const point = lngLatToPixel(
      mishima!.lng,
      mishima!.lat,
      AREA_JA_1440.zoom,
      AREA_JA_1440.center[0],
      AREA_JA_1440.center[1],
      width,
      height,
    );
    const placed = placeAreaBadgeCenters(
      [{ id: mishima!.id, count: mishima!.count, x: point.x, y: point.y }],
      wrong,
      { left: 4, top: 4, right: width - 4, bottom: height - 4 },
    );
    expect(placed).toHaveLength(0);
  });
});
