import type { HomeMapLabel } from "~/lib/home-map-labels";
import { homeMapLabelText } from "~/lib/home-map-labels";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export type AreaBadgeSizeTier = "s" | "m" | "l";

export function areaBadgeSizeTier(count: number): AreaBadgeSizeTier {
  if (count >= 300) return "l";
  if (count >= 50) return "m";
  return "s";
}

/** Count text for badge face (ja-JP grouping for 1000+). */
export function formatAreaBadgeCount(count: number): string {
  if (count > 999) return count.toLocaleString("ja-JP");
  return String(count);
}

export type HomeMapAreaBadgeKind = "pref" | "area";

/** Area badges link to location pages; prefecture badges must not navigate. */
export function areaBadgeLocationHref(
  label: HomeMapLabel,
  kind: HomeMapAreaBadgeKind,
  locale: HomeLocale,
): string | null {
  if (kind === "pref") return null;
  return withPilgrimageLocale(`/pilgrimage/locations/${label.id}`, locale);
}

export function areaBadgeAriaLabel(
  label: HomeMapLabel,
  locale: HomeLocale,
): string {
  const name = homeMapLabelText(label, locale);
  const countText = formatAreaBadgeCount(label.count);
  if (locale === "en") return `${name} ${countText} spots`;
  if (locale === "zh") return `${name} ${countText}处`;
  if (locale === "zh-tw") return `${name} ${countText}處`;
  return `${name} ${countText}件`;
}

export function areaBadgeTooltip(
  label: HomeMapLabel,
  locale: HomeLocale,
): string {
  const name = homeMapLabelText(label, locale);
  const countText = formatAreaBadgeCount(label.count);
  if (locale === "en") return `${name} · ${countText} spots`;
  if (locale === "zh") return `${name} · ${countText}处`;
  if (locale === "zh-tw") return `${name} · ${countText}處`;
  return `${name} · ${countText}件`;
}

/** Approximate badge box in CSS pixels for collision (before DOM measure). */
export function areaBadgeBoxSize(count: number): { width: number; height: number } {
  const tier = areaBadgeSizeTier(count);
  const text = formatAreaBadgeCount(count);
  const height = tier === "s" ? 26 : tier === "m" ? 32 : 38;
  const horizontalPad = tier === "s" ? 12 : tier === "m" ? 14 : 16;
  const charWidth = tier === "s" ? 7 : tier === "m" ? 7.5 : 8;
  const width = Math.max(height, Math.ceil(text.length * charWidth + horizontalPad));
  return { width, height };
}

function badgeTextWidthForTier(text: string, tier: AreaBadgeSizeTier): number {
  const digitWidth = tier === "s" ? 7.25 : tier === "m" ? 7.97 : 8.45;
  const commaWidth = tier === "s" ? 3.5 : tier === "m" ? 4 : 4.5;
  let width = 0;
  for (const ch of text) {
    width += ch === "," ? commaWidth : digitWidth;
  }
  return width;
}

/** Border-box outer size for prefecture badges (matches .ag-b tier CSS). */
export function prefectureBadgeBoxSize(count: number): {
  width: number;
  height: number;
} {
  const tier = areaBadgeSizeTier(count);
  const height = tier === "s" ? 26 : tier === "m" ? 32 : 38;
  const horizontalPad = tier === "s" ? 12 : tier === "m" ? 14 : 16;
  const textWidth = badgeTextWidthForTier(formatAreaBadgeCount(count), tier);
  const width = Math.max(
    height,
    horizontalPad + textWidth + BADGE_BORDER_PX * 2,
  );
  return { width, height };
}

export function prefecturePinInViewport(
  pinX: number,
  pinY: number,
  viewport: AxisRect,
): boolean {
  return (
    pinX >= viewport.left &&
    pinX <= viewport.right &&
    pinY >= viewport.top &&
    pinY <= viewport.bottom
  );
}

export function prefecturePinInVisibleMap(
  pinX: number,
  pinY: number,
  viewport: AxisRect,
  _obstacles: readonly AxisRect[] = [],
): boolean {
  return prefecturePinInViewport(pinX, pinY, viewport);
}

export interface AreaBadgePlacementInput {
  id: string;
  count: number;
  x: number;
  y: number;
}

export interface AxisRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const BADGE_GAP = 3;
export const PREFECTURE_BADGE_GAP = 2;
export const PREFECTURE_BADGE_OFFSET_MAX_PX = 14;
/** Max |dx| and |dy| when both axes move (standard prefecture diagonal search). */
export const PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX = 10;
/** Osaka extended search (24px / 18px per axis); Kyoto up-only rescue uses the same cap. */
export const OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX = 24;
export const OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX = 18;
/** @deprecated Use OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX. */
export const OSAKA_PREFECTURE_OFFSET_MAX_PX = OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX;
const BADGE_BORDER_PX = 1.5;

export interface PrefectureOffsetLimits {
  maxTotalPx: number;
  diagonalAxisMaxPx: number;
}

export function prefectureOffsetLimitsForId(_id: string): PrefectureOffsetLimits {
  return {
    maxTotalPx: PREFECTURE_BADGE_OFFSET_MAX_PX,
    diagonalAxisMaxPx: PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
  };
}

export const OSAKA_EXTENDED_PREFECTURE_OFFSET_LIMITS: PrefectureOffsetLimits = {
  maxTotalPx: OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX,
  diagonalAxisMaxPx: OSAKA_KYOTO_PREFECTURE_DIAGONAL_AXIS_MAX_PX,
};

const prefOffsetSearchCache = new Map<
  string,
  ReadonlyArray<{ dx: number; dy: number }>
>();

export function prefectureOffsetAllowed(
  dx: number,
  dy: number,
  maxTotalPx = PREFECTURE_BADGE_OFFSET_MAX_PX,
  diagonalAxisMaxPx = PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
): boolean {
  if (dx === 0 && dy === 0) return true;
  if (Math.hypot(dx, dy) > maxTotalPx) return false;
  if (dx !== 0 && dy !== 0) {
    if (Math.abs(dx) > diagonalAxisMaxPx) return false;
    if (Math.abs(dy) > diagonalAxisMaxPx) return false;
  }
  return true;
}

/** Integer offsets within total/diagonal limits, nearest Euclidean distance first. */
export function prefectureOffsetSearchPoints(
  maxTotalPx = PREFECTURE_BADGE_OFFSET_MAX_PX,
  diagonalAxisMaxPx = PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX,
): ReadonlyArray<{ dx: number; dy: number }> {
  const cacheKey = `${maxTotalPx}:${diagonalAxisMaxPx}`;
  const cached = prefOffsetSearchCache.get(cacheKey);
  if (cached) return cached;
  const points: { dx: number; dy: number; dist: number }[] = [];
  for (let dx = -maxTotalPx; dx <= maxTotalPx; dx += 1) {
    for (let dy = -maxTotalPx; dy <= maxTotalPx; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      if (!prefectureOffsetAllowed(dx, dy, maxTotalPx, diagonalAxisMaxPx)) {
        continue;
      }
      points.push({ dx, dy, dist: Math.hypot(dx, dy) });
    }
  }
  points.sort(
    (a, b) => a.dist - b.dist || a.dx - b.dx || a.dy - b.dy,
  );
  const ordered = points.map(({ dx, dy }) => ({ dx, dy }));
  prefOffsetSearchCache.set(cacheKey, ordered);
  return ordered;
}

function rectsOverlap(a: AxisRect, b: AxisRect, gap: number): boolean {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

export function badgeRectAt(centerX: number, centerY: number, count: number): AxisRect {
  const { width, height } = areaBadgeBoxSize(count);
  const halfW = width / 2;
  const halfH = height / 2;
  return {
    left: centerX - halfW,
    top: centerY - halfH,
    right: centerX + halfW,
    bottom: centerY + halfH,
  };
}

export function prefectureBadgeRectAt(
  centerX: number,
  centerY: number,
  count: number,
): AxisRect {
  const { width, height } = prefectureBadgeBoxSize(count);
  const halfW = width / 2;
  const halfH = height / 2;
  return {
    left: centerX - halfW,
    top: centerY - halfH,
    right: centerX + halfW,
    bottom: centerY + halfH,
  };
}

function prefectureBadgeBlockedAt(
  centerX: number,
  centerY: number,
  count: number,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
): boolean {
  const rect = prefectureBadgeRectAt(centerX, centerY, count);
  if (
    rect.left < viewport.left ||
    rect.top < viewport.top ||
    rect.right > viewport.right ||
    rect.bottom > viewport.bottom
  ) {
    return true;
  }
  for (const obstacle of obstacles) {
    if (rectsOverlap(rect, obstacle, gap)) return true;
  }
  for (const other of placedRects) {
    if (rectsOverlap(rect, other, gap)) return true;
  }
  return false;
}

function prefectureOffsetWithin(
  pinX: number,
  pinY: number,
  centerX: number,
  centerY: number,
  limits: PrefectureOffsetLimits,
): boolean {
  const dx = centerX - pinX;
  const dy = centerY - pinY;
  return prefectureOffsetAllowed(
    dx,
    dy,
    limits.maxTotalPx,
    limits.diagonalAxisMaxPx,
  );
}

function findPrefectureBadgePosition(
  candidate: AreaBadgePlacementInput,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
  limits: PrefectureOffsetLimits = prefectureOffsetLimitsForId(candidate.id),
): { x: number; y: number } | null {
  const { x: pinX, y: pinY } = candidate;
  if (!prefecturePinInVisibleMap(pinX, pinY, viewport, obstacles)) {
    return null;
  }

  const tryAt = (x: number, y: number): { x: number; y: number } | null => {
    if (!prefectureOffsetWithin(pinX, pinY, x, y, limits)) {
      return null;
    }
    return prefectureBadgeBlockedAt(
      x,
      y,
      candidate.count,
      viewport,
      obstacles,
      placedRects,
      gap,
    )
      ? null
      : { x, y };
  };

  const center = tryAt(pinX, pinY);
  if (center) return center;

  for (const { dx, dy } of prefectureOffsetSearchPoints(
    limits.maxTotalPx,
    limits.diagonalAxisMaxPx,
  )) {
    const offset = tryAt(pinX + dx, pinY + dy);
    if (offset) return offset;
  }

  return null;
}

function prefecturePlacedRects(
  placed: readonly AreaBadgePlacementInput[],
): AxisRect[] {
  return placed.map((item) =>
    prefectureBadgeRectAt(item.x, item.y, item.count),
  );
}

/** Round-5-style pass: every prefecture except Osaka, standard 14px / 10px limits. */
export function placePrefectureBadgeCentersWithoutOsaka(
  candidates: readonly AreaBadgePlacementInput[],
  obstacles: readonly AxisRect[],
  viewport: AxisRect,
  gap = PREFECTURE_BADGE_GAP,
): AreaBadgePlacementInput[] {
  const sorted = [...candidates]
    .filter((item) => item.id !== "osaka")
    .sort((a, b) => b.count - a.count);
  const placed: AreaBadgePlacementInput[] = [];
  const placedRects: AxisRect[] = [];

  for (const candidate of sorted) {
    const position = findPrefectureBadgePosition(
      candidate,
      viewport,
      obstacles,
      placedRects,
      gap,
    );
    if (!position) continue;
    placed.push({ ...candidate, ...position });
    placedRects.push(
      prefectureBadgeRectAt(position.x, position.y, candidate.count),
    );
  }
  return placed;
}

function tryPlaceOsakaInRemainingSpace(
  osaka: AreaBadgePlacementInput,
  placed: readonly AreaBadgePlacementInput[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap: number,
): AreaBadgePlacementInput | null {
  const placedRects = prefecturePlacedRects(placed);
  const position = findPrefectureBadgePosition(
    osaka,
    viewport,
    obstacles,
    placedRects,
    gap,
    OSAKA_EXTENDED_PREFECTURE_OFFSET_LIMITS,
  );
  if (!position) return null;
  return { ...osaka, ...position };
}

function mergeStableWithOsakaAndOptionalKyotoUp(
  stablePlaced: readonly AreaBadgePlacementInput[],
  osakaPlaced: AreaBadgePlacementInput,
  kyotoMoved: AreaBadgePlacementInput | null,
): AreaBadgePlacementInput[] {
  const result: AreaBadgePlacementInput[] = [];
  for (const item of stablePlaced) {
    if (item.id === "kyoto" && kyotoMoved) {
      result.push(kyotoMoved);
      continue;
    }
    result.push(item);
  }
  result.push(osakaPlaced);
  return result;
}

function tryPlaceOsakaWithKyotoUpOnly(
  osaka: AreaBadgePlacementInput,
  stablePlaced: readonly AreaBadgePlacementInput[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap: number,
): AreaBadgePlacementInput[] | null {
  const kyotoIndex = stablePlaced.findIndex((item) => item.id === "kyoto");
  if (kyotoIndex < 0) return null;
  const kyotoStable = stablePlaced[kyotoIndex]!;
  const others = stablePlaced.filter((_, index) => index !== kyotoIndex);
  const otherRects = prefecturePlacedRects(others);

  for (let upPx = 1; upPx <= OSAKA_KYOTO_PREFECTURE_OFFSET_MAX_PX; upPx += 1) {
    const kyotoY = kyotoStable.y - upPx;
    if (
      prefectureBadgeBlockedAt(
        kyotoStable.x,
        kyotoY,
        kyotoStable.count,
        viewport,
        obstacles,
        otherRects,
        gap,
      )
    ) {
      continue;
    }
    const kyotoRect = prefectureBadgeRectAt(
      kyotoStable.x,
      kyotoY,
      kyotoStable.count,
    );
    const osakaPosition = findPrefectureBadgePosition(
      osaka,
      viewport,
      obstacles,
      [...otherRects, kyotoRect],
      gap,
      OSAKA_EXTENDED_PREFECTURE_OFFSET_LIMITS,
    );
    if (!osakaPosition) continue;
    const kyotoMoved = { ...kyotoStable, x: kyotoStable.x, y: kyotoY };
    return mergeStableWithOsakaAndOptionalKyotoUp(
      stablePlaced,
      { ...osaka, ...osakaPosition },
      kyotoMoved,
    );
  }
  return null;
}

/** Greedy placement: highest count first, 3px gap, skip on collision. */
export function placeAreaBadgeCenters(
  candidates: readonly AreaBadgePlacementInput[],
  obstacles: readonly AxisRect[],
  viewport: AxisRect,
  gap = BADGE_GAP,
): AreaBadgePlacementInput[] {
  const sorted = [...candidates].sort((a, b) => b.count - a.count);
  const placed: AreaBadgePlacementInput[] = [];
  const placedRects: AxisRect[] = [];

  for (const candidate of sorted) {
    const rect = badgeRectAt(candidate.x, candidate.y, candidate.count);
    if (
      rect.left < viewport.left ||
      rect.top < viewport.top ||
      rect.right > viewport.right ||
      rect.bottom > viewport.bottom
    ) {
      continue;
    }
    let blocked = false;
    for (const obstacle of obstacles) {
      if (rectsOverlap(rect, obstacle, gap)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    for (const other of placedRects) {
      if (rectsOverlap(rect, other, gap)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    placed.push(candidate);
    placedRects.push(rect);
  }
  return placed;
}

/** Prefecture placement: stable pass without Osaka, then Osaka-only fit. */
export function placePrefectureBadgeCenters(
  candidates: readonly AreaBadgePlacementInput[],
  obstacles: readonly AxisRect[],
  viewport: AxisRect,
  gap = PREFECTURE_BADGE_GAP,
): AreaBadgePlacementInput[] {
  const stable = placePrefectureBadgeCentersWithoutOsaka(
    candidates,
    obstacles,
    viewport,
    gap,
  );
  const osaka = candidates.find((item) => item.id === "osaka");
  if (!osaka) return stable;

  const osakaPlaced = tryPlaceOsakaInRemainingSpace(
    osaka,
    stable,
    viewport,
    obstacles,
    gap,
  );
  if (osakaPlaced) {
    return mergeStableWithOsakaAndOptionalKyotoUp(stable, osakaPlaced, null);
  }

  const withKyotoUp = tryPlaceOsakaWithKyotoUpOnly(
    osaka,
    stable,
    viewport,
    obstacles,
    gap,
  );
  if (withKyotoUp) return withKyotoUp;

  return stable;
}

/** Prefecture pills: zoom in [0, 7). Area pills: [7, 12). */
export const HOME_MAP_AREA_BADGE_MIN_ZOOM = 7;

export function homeMapAreaBadgeZoomBand(zoom: number): "pref" | "area" | "none" {
  if (zoom >= 12) return "none";
  if (zoom >= 7) return "area";
  return "pref";
}
