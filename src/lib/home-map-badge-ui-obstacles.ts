import type { Map as MapLibreMap } from "maplibre-gl";
import type { AxisRect } from "~/lib/home-map-area-badge-format";

/** Google attribution often grows after async copyright (e.g. +TMap Mobility). */
export const HOME_GOOGLE_ATTRIBUTION_MIN_WIDTH_PX = 211;
const HOME_GOOGLE_ATTRIBUTION_CONSERVATIVE_HEIGHT_PX = 44;

export const HOME_MAP_BADGE_UI_OBSTACLE_WATCH_SELECTORS = [
  ".google-map-tiles-attribution",
  ".maplibregl-ctrl-attrib",
  ".home-map-tools",
  ".home-nearby-sheet",
  ".home-map-searchstack",
  ".home-chip-scrim",
  ".home-work-search",
  ".home-nearby",
] as const;

function unionRect(a: AxisRect, b: AxisRect): AxisRect {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

function isGoogleAttributionRect(
  rect: AxisRect,
  mapWidth: number,
  mapHeight: number,
): boolean {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  return (
    rect.left <= mapWidth * 0.35 &&
    rect.bottom >= mapHeight - mapHeight * 0.25 &&
    width > 0 &&
    height > 0
  );
}

/** Matches `.home-map .google-map-tiles-attribution--home` mobile/desktop layout. */
export function conservativeHomeGoogleAttributionObstacle(
  mapWidth: number,
  mapHeight: number,
  sheetHeightPx: number,
): AxisRect {
  const mobile = mapWidth <= 1023;
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

export function mergeHomeMapBadgeUiObstacles(
  measured: readonly AxisRect[],
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
  for (const rect of measured) {
    if (isGoogleAttributionRect(rect, mapWidth, mapHeight)) {
      merged.push(unionRect(rect, conservative));
      replacedAttribution = true;
      continue;
    }
    merged.push(rect);
  }
  if (!replacedAttribution) {
    merged.push(conservative);
  }
  return merged;
}

function measureObstacleRects(
  containerRect: DOMRect,
  selectors: readonly string[],
): AxisRect[] {
  const rects: AxisRect[] = [];
  for (const selector of selectors) {
    for (const node of document.querySelectorAll(selector)) {
      if (!(node instanceof HTMLElement)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      rects.push({
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        right: rect.right - containerRect.left,
        bottom: rect.bottom - containerRect.top,
      });
    }
  }
  return rects;
}

export function readHomeNearbySheetHeightPx(): number {
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue("--home-sheet-height").trim();
  if (raw.endsWith("px")) {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 96;
}

function clipHomeNearbySheetObstacles(
  rects: readonly AxisRect[],
  mapHeight: number,
  sheetHeightPx: number,
): AxisRect[] {
  return rects.map((rect) => {
    if (rect.bottom < mapHeight - 2) return rect;
    return {
      left: rect.left,
      right: rect.right,
      top: Math.max(rect.top, mapHeight - sheetHeightPx),
      bottom: rect.bottom,
    };
  });
}

export function resolveHomeMapBadgeUiObstacles(
  map: MapLibreMap,
  selectors: readonly string[],
): AxisRect[] {
  const container = map.getContainer().getBoundingClientRect();
  const sheetHeightPx = readHomeNearbySheetHeightPx();
  const measured = clipHomeNearbySheetObstacles(
    measureObstacleRects(container, selectors),
    container.height,
    sheetHeightPx,
  );
  return mergeHomeMapBadgeUiObstacles(
    measured,
    container.width,
    container.height,
    sheetHeightPx,
  );
}

export function buildMobile390PlacementObstacles(
  width: number,
  height: number,
  sheetHeightPx = 96,
  earlyAttributionWidth = 135,
): AxisRect[] {
  const sheet: AxisRect = {
    left: 0,
    top: height - sheetHeightPx,
    right: width,
    bottom: height,
  };
  const conservative = conservativeHomeGoogleAttributionObstacle(
    width,
    height,
    sheetHeightPx,
  );
  const earlyAttribution: AxisRect = {
    left: conservative.left,
    top: conservative.top,
    right: conservative.left + earlyAttributionWidth,
    bottom: conservative.bottom,
  };
  return mergeHomeMapBadgeUiObstacles(
    [sheet, earlyAttribution],
    width,
    height,
    sheetHeightPx,
  );
}

/** Re-run badge placement when attribution or controls resize after load. */
export function attachHomeMapBadgeUiObstacleWatch(
  root: ParentNode,
  onChange: () => void,
): () => void {
  let frame = 0;
  const schedule = (): void => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      onChange();
    });
  };

  const observed = new Set<Element>();
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(schedule)
      : null;

  const observeNode = (node: Element): void => {
    if (observed.has(node)) return;
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

  const mutationObserver = new MutationObserver(() => {
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
