import { describe, expect, it } from "vitest";
import type { AxisRect } from "~/lib/home-map-area-badge-format";
import {
  HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX,
  HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS,
  conservativeHomeGoogleAttributionObstacle,
  mergeHomeMapBadgeUiObstacles,
} from "~/lib/home-map-badge-ui-obstacles";

describe("mergeHomeMapBadgeUiObstacles", () => {
  it("expands a narrow measured Google attribution rect to the conservative minimum width", () => {
    const mapWidth = 390;
    const mapHeight = 844;
    const sheetHeight = 96;
    const earlyAttribution: AxisRect = {
      left: 8,
      top: 694,
      right: 8 + 135,
      bottom: 738,
    };
    const merged = mergeHomeMapBadgeUiObstacles(
      [earlyAttribution],
      mapWidth,
      mapHeight,
      sheetHeight,
    );
    const attribution = merged.find(
      (rect) => rect.right - rect.left >= HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX,
    );
    expect(attribution).toBeDefined();
    expect(attribution!.right - attribution!.left).toBeGreaterThanOrEqual(
      HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX,
    );
    expect(attribution!.left).toBe(8);
  });

  it("adds a conservative attribution rect before the DOM node exists", () => {
    const merged = mergeHomeMapBadgeUiObstacles([], 390, 844, 96);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      conservativeHomeGoogleAttributionObstacle(390, 844, 96),
    );
  });
});

describe("HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS", () => {
  it("includes Google attribution and map controls", () => {
    expect(HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS).toContain(
      ".google-map-tiles-attribution",
    );
    expect(HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS).toContain(
      ".home-map-tools",
    );
  });
});
