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
  obstacles: readonly AxisRect[] = [],
): boolean {
  if (!prefecturePinInViewport(pinX, pinY, viewport)) return false;
  for (const obstacle of obstacles) {
    if (
      pinX >= obstacle.left &&
      pinX <= obstacle.right &&
      pinY >= obstacle.top &&
      pinY <= obstacle.bottom
    ) {
      return false;
    }
  }
  return true;
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
const OSAKA_KYOTO_PAIR_OFFSET_MAX_PX = 32;
const BADGE_BORDER_PX = 1.5;

/** Neighbours evicted before dropping Osaka when space is tight (lowest priority first). */
const OSAKA_EVICTION_PREF_IDS: readonly string[] = [
  "nara",
  "okayama",
  "wakayama",
  "hyogo",
  "shiga",
  "mie",
  "tokushima",
  "kagawa",
  "ehime",
  "kochi",
  "tottori",
  "shimane",
  "gifu",
  "aichi",
  "fukui",
  "ishikawa",
  "toyama",
  "nagasaki",
  "saga",
  "oita",
  "kumamoto",
  "miyazaki",
  "kagoshima",
  "fukuoka",
];

const PREF_OFFSET_DIRECTIONS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

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
  maxPx: number,
): boolean {
  return (
    Math.abs(centerX - pinX) + Math.abs(centerY - pinY) <= maxPx
  );
}

function findPrefectureBadgePosition(
  candidate: AreaBadgePlacementInput,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
): { x: number; y: number } | null {
  const { x: pinX, y: pinY } = candidate;
  if (!prefecturePinInVisibleMap(pinX, pinY, viewport, obstacles)) {
    return null;
  }

  const tryAt = (x: number, y: number): { x: number; y: number } | null => {
    if (
      !prefectureOffsetWithin(
        pinX,
        pinY,
        x,
        y,
        PREFECTURE_BADGE_OFFSET_MAX_PX,
      )
    ) {
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

  for (const { dx, dy } of PREF_OFFSET_DIRECTIONS) {
    for (let step = 1; step <= PREFECTURE_BADGE_OFFSET_MAX_PX; step += 1) {
      const offset = tryAt(pinX + dx * step, pinY + dy * step);
      if (offset) return offset;
    }
  }

  return null;
}

function tryOsakaKyotoPrefecturePairing(
  osaka: AreaBadgePlacementInput,
  placed: AreaBadgePlacementInput[],
  placedRects: AxisRect[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap: number,
): boolean {
  const kyotoIndex = placed.findIndex((item) => item.id === "kyoto");
  if (kyotoIndex < 0) return false;
  const kyoto = placed[kyotoIndex];
  if (!kyoto) return false;
  const otherRects = placedRects.filter((_, index) => index !== kyotoIndex);

  for (let delta = 1; delta <= OSAKA_KYOTO_PAIR_OFFSET_MAX_PX; delta += 1) {
    for (const osakaSign of [1, -1] as const) {
      const forcedKyoto = {
        x: kyoto.x,
        y: kyoto.y - delta,
      };
      if (
        !prefecturePinInVisibleMap(kyoto.x, kyoto.y, viewport, obstacles) ||
        prefectureBadgeBlockedAt(
          forcedKyoto.x,
          forcedKyoto.y,
          kyoto.count,
          viewport,
          obstacles,
          otherRects,
          gap,
        )
      ) {
        continue;
      }
      const kyotoRect = prefectureBadgeRectAt(
        forcedKyoto.x,
        forcedKyoto.y,
        kyoto.count,
      );
      const forcedOsaka = {
        x: osaka.x,
        y: osaka.y + osakaSign * delta,
      };
      if (
        !prefecturePinInVisibleMap(osaka.x, osaka.y, viewport, obstacles) ||
        prefectureBadgeBlockedAt(
          forcedOsaka.x,
          forcedOsaka.y,
          osaka.count,
          viewport,
          obstacles,
          [...otherRects, kyotoRect],
          gap,
        )
      ) {
        continue;
      }
      placed[kyotoIndex] = { ...kyoto, ...forcedKyoto };
      placedRects[kyotoIndex] = kyotoRect;
      placed.push({ ...osaka, ...forcedOsaka });
      placedRects.push(
        prefectureBadgeRectAt(forcedOsaka.x, forcedOsaka.y, osaka.count),
      );
      return true;
    }
  }
  return false;
}

function tryOsakaPrefectureFallback(
  osaka: AreaBadgePlacementInput,
  placed: AreaBadgePlacementInput[],
  placedRects: AxisRect[],
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  gap: number,
): boolean {
  const commitOsaka = (position: { x: number; y: number }): void => {
    placed.push({ ...osaka, ...position });
    placedRects.push(
      prefectureBadgeRectAt(position.x, position.y, osaka.count),
    );
  };

  if (
    tryOsakaKyotoPrefecturePairing(
      osaka,
      placed,
      placedRects,
      viewport,
      obstacles,
      gap,
    )
  ) {
    return true;
  }

  const tryPlaceOsakaNow = (): { x: number; y: number } | null =>
    findPrefectureBadgePosition(
      osaka,
      viewport,
      obstacles,
      placedRects,
      gap,
    );

  const position = tryPlaceOsakaNow();
  if (position) {
    commitOsaka(position);
    return true;
  }

  const evictOrder = new Map(
    OSAKA_EVICTION_PREF_IDS.map((id, index) => [id, index]),
  );
  while (true) {
    let evictIndex = -1;
    let evictRank = Number.POSITIVE_INFINITY;
    let evictCount = Number.POSITIVE_INFINITY;
    for (let index = 0; index < placed.length; index += 1) {
      const item = placed[index];
      if (!item) continue;
      const listedRank = evictOrder.get(item.id);
      if (listedRank === undefined && item.count >= osaka.count) continue;
      const rank = listedRank ?? 10_000 + item.count;
      if (
        rank < evictRank ||
        (rank === evictRank && item.count < evictCount)
      ) {
        evictIndex = index;
        evictRank = rank;
        evictCount = item.count;
      }
    }
    if (evictIndex < 0) return false;
    placed.splice(evictIndex, 1);
    placedRects.splice(evictIndex, 1);
    const retry = tryPlaceOsakaNow();
    if (retry) {
      commitOsaka(retry);
      return true;
    }
    if (
      tryOsakaKyotoPrefecturePairing(
        osaka,
        placed,
        placedRects,
        viewport,
        obstacles,
        gap,
      )
    ) {
      return true;
    }
  }
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

/** Prefecture-only greedy placement with outward offset search and Osaka/Kyoto pairing. */
export function placePrefectureBadgeCenters(
  candidates: readonly AreaBadgePlacementInput[],
  obstacles: readonly AxisRect[],
  viewport: AxisRect,
  gap = PREFECTURE_BADGE_GAP,
): AreaBadgePlacementInput[] {
  const sorted = [...candidates].sort((a, b) => b.count - a.count);
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
    if (position) {
      placed.push({ ...candidate, ...position });
      placedRects.push(
        prefectureBadgeRectAt(position.x, position.y, candidate.count),
      );
      continue;
    }
    if (
      candidate.id === "osaka" &&
      tryOsakaPrefectureFallback(
        candidate,
        placed,
        placedRects,
        viewport,
        obstacles,
        gap,
      )
    ) {
      continue;
    }
  }
  return placed;
}

/** Prefecture pills: zoom in [0, 7). Area pills: [7, 12). */
export const HOME_MAP_AREA_BADGE_MIN_ZOOM = 7;

export function homeMapAreaBadgeZoomBand(zoom: number): "pref" | "area" | "none" {
  if (zoom >= 12) return "none";
  if (zoom >= 7) return "area";
  return "pref";
}
