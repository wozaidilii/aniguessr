import type { Map as MapLibreMap } from "maplibre-gl";
import type { AxisRect } from "~/lib/home-map-area-badge-format";

/** Google attribution often grows after async copyright (e.g. +TMap Mobility). */
export const HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX = 211;
export const HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX = 44;

export const HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR =
  ".google-map-tiles-attribution.google-map-tiles-attribution--home";

export const HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS = [
  HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR,
  ".maplibregl-ctrl-attrib",
  ".home-map-tools",
  ".home-nearby-sheet",
  ".home-map-searchstack",
  ".home-chip-scrim",
  ".home-work-search",
] as const;

const BADGE_OVERLAY_SELECTOR = ".home-map-area-badges";

type MeasuredObstacleKind = "google" | "sheet" | "ui";

interface MeasuredObstacle {
  rect: AxisRect;
  kind: MeasuredObstacleKind;
}

function unionRect(a: AxisRect, b: AxisRect): AxisRect {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

function obstacleKindForSelector(selector: string): MeasuredObstacleKind {
  if (selector === HOME_GOOGLE_ATTRIBUTION_OBSTACLE_SELECTOR) return "google";
  if (selector === ".home-nearby-sheet") return "sheet";
  return "ui";
}

function measureObstacleRects(
  containerRect: DOMRect,
  selectors: readonly string[],
): MeasuredObstacle[] {
  const measured: MeasuredObstacle[] = [];
  for (const selector of selectors) {
    for (const node of document.querySelectorAll(selector)) {
      if (!(node instanceof HTMLElement)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      measured.push({
        kind: obstacleKindForSelector(selector),
        rect: {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          right: rect.right - containerRect.left,
          bottom: rect.bottom - containerRect.top,
        },
      });
    }
  }
  return measured;
}

export function isMobileHomeMapViewport(mapWidth: number): boolean {
  return mapWidth <= 1023;
}

/** Sheet offset for attribution placement; 0 on desktop or when the sheet is absent. */
export function readHomeNearbySheetHeightPx(mapWidth: number): number {
  if (!isMobileHomeMapViewport(mapWidth)) return 0;
  const sheet = document.querySelector(".home-nearby-sheet");
  if (!(sheet instanceof HTMLElement)) return 0;
  const style = getComputedStyle(sheet);
  if (style.display === "none" || style.visibility === "hidden") return 0;
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue("--home-sheet-height").trim();
  if (raw.endsWith("px")) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return sheet.getBoundingClientRect().height > 0
    ? Math.min(sheet.getBoundingClientRect().height, 372)
    : 0;
}

/** Matches `.home-map .google-map-tiles-attribution--home` mobile/desktop layout. */
export function conservativeHomeGoogleAttributionObstacle(
  mapWidth: number,
  mapHeight: number,
  sheetHeightPx: number,
): AxisRect {
  const mobile = isMobileHomeMapViewport(mapWidth);
  const left = mobile ? 8 : 10;
  const bottomGap = sheetHeightPx + (mobile ? 10 : 12);
  const height = HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX;
  const width = HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX;
  return {
    left,
    top: mapHeight - bottomGap - height,
    right: left + width,
    bottom: mapHeight - bottomGap,
  };
}

export function mergePrefectureGoogleAttributionObstacle(
  measured: readonly MeasuredObstacle[],
  mapWidth: number,
  mapHeight: number,
  sheetHeightPx: number,
): AxisRect[] {
  const conservative = conservativeHomeGoogleAttributionObstacle(
    mapWidth,
    mapHeight,
    sheetHeightPx,
  );
  const merged: AxisRect[] = [];
  let replacedAttribution = false;
  for (const item of measured) {
    if (item.kind === "google") {
      merged.push(unionRect(item.rect, conservative));
      replacedAttribution = true;
      continue;
    }
    merged.push(item.rect);
  }
  if (!replacedAttribution) {
    merged.push(conservative);
  }
  return merged;
}

/** Prod-style area obstacles: measured DOM rects only (48e6680 parity). */
export function resolveHomeMapAreaBadgeUiObstacles(
  map: MapLibreMap,
  selectors: readonly string[],
): AxisRect[] {
  const container = map.getContainer().getBoundingClientRect();
  return measureObstacleRects(container, selectors).map((item) => item.rect);
}

/** Prefecture obstacles with conservative Google attribution sizing. */
export function resolveHomeMapPrefectureBadgeUiObstacles(
  map: MapLibreMap,
  selectors: readonly string[],
): AxisRect[] {
  const container = map.getContainer().getBoundingClientRect();
  const sheetHeightPx = readHomeNearbySheetHeightPx(container.width);
  const measured = measureObstacleRects(container, selectors);
  return mergePrefectureGoogleAttributionObstacle(
    measured,
    container.width,
    container.height,
    sheetHeightPx,
  );
}

/** @deprecated use mergePrefectureGoogleAttributionObstacle in tests */
export function mergeHomeMapBadgeUiObstacles(
  measured: readonly AxisRect[],
  mapWidth: number,
  mapHeight: number,
  sheetHeightPx: number,
): AxisRect[] {
  return mergePrefectureGoogleAttributionObstacle(
    measured.map((rect) => ({ rect, kind: "google" as const })),
    mapWidth,
    mapHeight,
    sheetHeightPx,
  );
}

export function buildMobile390PlacementObstacles(
  width: number,
  height: number,
  sheetHeightPx = 96,
  earlyAttributionWidth = 135,
): AxisRect[] {
  const sheet: MeasuredObstacle = {
    kind: "sheet",
    rect: {
      left: 0,
      top: height - sheetHeightPx,
      right: width,
      bottom: height,
    },
  };
  const conservative = conservativeHomeGoogleAttributionObstacle(
    width,
    height,
    sheetHeightPx,
  );
  const earlyAttribution: MeasuredObstacle = {
    kind: "google",
    rect: {
      left: conservative.left,
      top: conservative.top,
      right: conservative.left + earlyAttributionWidth,
      bottom: conservative.bottom,
    },
  };
  return mergePrefectureGoogleAttributionObstacle(
    [sheet, earlyAttribution],
    width,
    height,
    sheetHeightPx,
  );
}

/** @internal Exported for unit tests (mock observers / mutation filtering). */
export function mutationAffectsObstacleWatch(
  mutation: MutationRecord,
  _root: ParentNode,
): boolean {
  const target = mutation.target;
  if (target == null || typeof target !== "object") return false;
  const element =
    "closest" in target && typeof (target as Element).closest === "function"
      ? (target as Element)
      : "parentElement" in target
        ? ((target as CharacterData).parentElement ?? null)
        : null;
  if (!element) return false;
  if (element.closest(BADGE_OVERLAY_SELECTOR)) return false;
  for (const selector of HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS) {
    if (element.matches(selector) || element.closest(selector)) return true;
  }
  if (mutation.type === "childList") {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches(BADGE_OVERLAY_SELECTOR) || node.closest(BADGE_OVERLAY_SELECTOR)) {
        continue;
      }
      for (const selector of HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS) {
        if (node.matches(selector) || node.querySelector(selector)) return true;
      }
    }
  }
  if (
    mutation.type === "characterData" &&
    element.classList.contains("google-map-tiles-attribution-text")
  ) {
    return true;
  }
  return false;
}

/** Re-run badge placement when attribution or controls resize after load. */
export function attachHomeMapBadgeUiObstacleWatch(
  root: ParentNode,
  onChange: () => void,
): () => void {
  let frame = 0;
  let running = false;
  const schedule = (): void => {
    if (running) return;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      running = true;
      try {
        onChange();
      } finally {
        running = false;
      }
    });
  };

  const observed = new Set<Element>();
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null;

  const observeNode = (node: Element): void => {
    if (observed.has(node)) return;
    if (node.closest(BADGE_OVERLAY_SELECTOR)) return;
    observed.add(node);
    resizeObserver?.observe(node);
  };

  const scan = (): void => {
    for (const selector of HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS) {
      for (const node of root.querySelectorAll(selector)) {
        observeNode(node);
      }
    }
  };

  scan();

  const mutationObserver = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutationAffectsObstacleWatch(mutation, root))) {
      return;
    }
    scan();
    schedule();
  });
  mutationObserver.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    mutationObserver.disconnect();
    observed.clear();
  };
}
