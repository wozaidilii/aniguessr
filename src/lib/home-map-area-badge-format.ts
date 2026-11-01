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
/** Max |dx| and |dy| when both axes move (diagonal search). */
export const PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX = 10;
/** Osaka/Kyoto pairing only (not general diagonal offset search). */
export const OSAKA_PREFECTURE_OFFSET_MAX_PX = 32;
const OSAKA_KYOTO_PAIR_OFFSET_MAX_PX = OSAKA_PREFECTURE_OFFSET_MAX_PX;
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
  "kyoto",
];

const prefOffsetSearchCache = new Map<
  number,
  ReadonlyArray<{ dx: number; dy: number }>
>();

export function prefectureOffsetAllowed(
  dx: number,
  dy: number,
  maxTotalPx = PREFECTURE_BADGE_OFFSET_MAX_PX,
): boolean {
  if (dx === 0 && dy === 0) return true;
  if (Math.hypot(dx, dy) > maxTotalPx) return false;
  if (dx !== 0 && dy !== 0) {
    if (Math.abs(dx) > PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX) return false;
    if (Math.abs(dy) > PREFECTURE_BADGE_DIAGONAL_AXIS_MAX_PX) return false;
  }
  return true;
}

/** Integer offsets within total/diagonal limits, nearest Euclidean distance first. */
export function prefectureOffsetSearchPoints(
  maxTotalPx = PREFECTURE_BADGE_OFFSET_MAX_PX,
): ReadonlyArray<{ dx: number; dy: number }> {
  const cached = prefOffsetSearchCache.get(maxTotalPx);
  if (cached) return cached;
  const points: { dx: number; dy: number; dist: number }[] = [];
  for (let dx = -maxTotalPx; dx <= maxTotalPx; dx += 1) {
    for (let dy = -maxTotalPx; dy <= maxTotalPx; dy += 1) {
      if (dx === 0 && dy === 0) continue;
      if (!prefectureOffsetAllowed(dx, dy, maxTotalPx)) continue;
      points.push({ dx, dy, dist: Math.hypot(dx, dy) });
    }
  }
  points.sort(
    (a, b) => a.dist - b.dist || a.dx - b.dx || a.dy - b.dy,
  );
  const ordered = points.map(({ dx, dy }) => ({ dx, dy }));
  prefOffsetSearchCache.set(maxTotalPx, ordered);
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
  maxTotalPx: number,
): boolean {
  const dx = centerX - pinX;
  const dy = centerY - pinY;
  return prefectureOffsetAllowed(dx, dy, maxTotalPx);
}

function findPrefectureBadgePosition(
  candidate: AreaBadgePlacementInput,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
  maxOffsetPx = PREFECTURE_BADGE_OFFSET_MAX_PX,
): { x: number; y: number } | null {
  const { x: pinX, y: pinY } = candidate;
  if (!prefecturePinInVisibleMap(pinX, pinY, viewport, obstacles)) {
    return null;
  }

  const tryAt = (x: number, y: number): { x: number; y: number } | null => {
    if (!prefectureOffsetWithin(pinX, pinY, x, y, maxOffsetPx)) {
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

  for (const { dx, dy } of prefectureOffsetSearchPoints(maxOffsetPx)) {
    const offset = tryAt(pinX + dx, pinY + dy);
    if (offset) return offset;
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
  kyotoCandidate: AreaBadgePlacementInput | null = null,
): boolean {
  const kyotoIndex = placed.findIndex((item) => item.id === "kyoto");
  const kyoto =
    kyotoIndex >= 0 ? placed[kyotoIndex] : (kyotoCandidate ?? undefined);
  if (!kyoto) return false;
  const otherRects =
    kyotoIndex >= 0
      ? placedRects.filter((_, index) => index !== kyotoIndex)
      : placedRects;

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
      if (kyotoIndex >= 0) {
        placed[kyotoIndex] = { ...kyoto, ...forcedKyoto };
        placedRects[kyotoIndex] = kyotoRect;
      } else {
        placed.push({ ...kyoto, ...forcedKyoto });
        placedRects.push(kyotoRect);
      }
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
  kyotoCandidate: AreaBadgePlacementInput | null = null,
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
      kyotoCandidate,
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
      PREFECTURE_BADGE_OFFSET_MAX_PX,
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
        kyotoCandidate,
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
  const kyotoCandidate =
    candidates.find((item) => item.id === "kyoto") ?? null;

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
        kyotoCandidate,
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
