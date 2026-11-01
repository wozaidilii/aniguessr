import { describe, expect, it, vi } from "vitest";
import {
  HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX,
  HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX,
  HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR,
  HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS,
  attachHomeMapBadgeUiObstacleWatch,
  conservativeHomeGoogleAttributionObstacle,
  mergePrefectureGoogleAttributionObstacle,
  mutationAffectsObstacleWatch,
} from "~/lib/home-map-badge-ui-obstacles";

describe("mergePrefectureGoogleAttributionObstacle", () => {
  it("expands a narrow measured Google attribution rect to the conservative minimum width", () => {
    const mapWidth = 390;
    const mapHeight = 844;
    const sheetHeight = 96;
    const earlyAttribution = {
      kind: "google" as const,
      rect: {
        left: 8,
        top: 694,
        right: 8 + 135,
        bottom: 738,
      },
    };
    const merged = mergePrefectureGoogleAttributionObstacle(
      [earlyAttribution],
      mapWidth,
      mapHeight,
      sheetHeight,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]!.right - merged[0]!.left).toBeGreaterThanOrEqual(
      HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX,
    );
  });

  it("does not treat the full-width sheet as Google attribution", () => {
    const mapWidth = 390;
    const mapHeight = 844;
    const sheetHeight = 96;
    const sheet = {
      kind: "sheet" as const,
      rect: { left: 0, top: 748, right: 390, bottom: 844 },
    };
    const google = {
      kind: "google" as const,
      rect: { left: 8, top: 694, right: 143, bottom: 738 },
    };
    const merged = mergePrefectureGoogleAttributionObstacle(
      [sheet, google],
      mapWidth,
      mapHeight,
      sheetHeight,
    );
    expect(merged).toHaveLength(2);
    const wide = merged.find((rect) => rect.right - rect.left >= mapWidth * 0.9);
    const narrow = merged.find(
      (rect) =>
        rect.right - rect.left >= HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX &&
        rect.right - rect.left < mapWidth * 0.9,
    );
    expect(wide?.top).toBe(748);
    expect(narrow?.top).toBeLessThan(740);
    expect(wide!.bottom - wide!.top).toBeLessThan(120);
  });

  it("uses desktop attribution height without a sheet offset", () => {
    const rect = conservativeHomeGoogleAttributionObstacle(1440, 900, 0);
    expect(rect.bottom - rect.top).toBe(HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX);
    expect(rect.top).toBe(900 - 12 - HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX);
  });
});

describe("mutationAffectsObstacleWatch", () => {
  it("ignores mutations inside the badge overlay", () => {
    const root = {
      querySelectorAll: () => [],
    } as unknown as ParentNode;
    const badge = {
      closest: (sel: string) =>
        sel === ".home-map-area-badges" ? badge : null,
      matches: () => false,
      parentElement: null,
    } as unknown as Element;
    const mutation = {
      type: "childList",
      target: badge,
      addedNodes: [],
    } as unknown as MutationRecord;
    expect(mutationAffectsObstacleWatch(mutation, root)).toBe(false);
  });

  it("reacts to Google attribution text updates", () => {
    const root = {
      querySelectorAll: () => [],
    } as unknown as ParentNode;
    const text = {
      classList: { contains: (name: string) => name === "google-map-tiles-attribution-text" },
      closest: () => null,
      matches: () => false,
      parentElement: null,
    } as unknown as Element;
    const mutation = {
      type: "characterData",
      target: text,
      addedNodes: [],
    } as unknown as MutationRecord;
    expect(mutationAffectsObstacleWatch(mutation, root)).toBe(true);
  });
});

describe("attachHomeMapBadgeUiObstacleWatch", () => {
  it("does not re-enter the change handler while it is running", () => {
    class MockResizeObserver {
      observe(): void {
        /* mock */
      }
      disconnect(): void {
        /* mock */
      }
    }
    class MockMutationObserver {
      observe(): void {
        /* mock */
      }
      disconnect(): void {
        /* mock */
      }
      constructor(_cb: MutationCallback) {
        /* mock */
      }
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.stubGlobal("MutationObserver", MockMutationObserver);

    let nested = 0;
    let maxNested = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    const root = {
      querySelectorAll: () => [],
    } as unknown as ParentNode;

    const detach = attachHomeMapBadgeUiObstacleWatch(root, () => {
      nested += 1;
      maxNested = Math.max(maxNested, nested);
      nested -= 1;
    });

    expect(maxNested).toBeLessThanOrEqual(1);
    detach();
    vi.unstubAllGlobals();
  });
});

describe("HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS", () => {
  it("targets Google attribution and controls but not the badge overlay", () => {
    expect(HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS.join(" ")).toContain(
      "google-map-tiles-attribution--home",
    );
    expect(HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR).toContain(
      "google-map-tiles-attribution--home",
    );
    expect(HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR).not.toContain(
      "home-nearby-sheet",
    );
    for (const selector of HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS) {
      expect(selector).not.toBe(".home-nearby");
    }
  });
});
