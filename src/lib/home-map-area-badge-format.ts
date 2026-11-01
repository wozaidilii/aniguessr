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
export const PREFECTURE_BADGE_OFFSET_MAX_PX = 14;
const OSAKA_KYOTO_PAIR_OFFSET_MAX_PX = 32;

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

function badgeBlockedAt(
  centerX: number,
  centerY: number,
  count: number,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
): boolean {
  const rect = badgeRectAt(centerX, centerY, count);
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

function clampBadgeCenterIntoViewport(
  centerX: number,
  centerY: number,
  count: number,
  viewport: AxisRect,
): { x: number; y: number } {
  const { width, height } = areaBadgeBoxSize(count);
  const halfW = width / 2;
  const halfH = height / 2;
  return {
    x: Math.min(
      Math.max(centerX, viewport.left + halfW),
      viewport.right - halfW,
    ),
    y: Math.min(
      Math.max(centerY, viewport.top + halfH),
      viewport.bottom - halfH,
    ),
  };
}

function findPrefectureBadgePosition(
  candidate: AreaBadgePlacementInput,
  viewport: AxisRect,
  obstacles: readonly AxisRect[],
  placedRects: readonly AxisRect[],
  gap: number,
): { x: number; y: number } | null {
  const tryAt = (x: number, y: number): { x: number; y: number } | null =>
    badgeBlockedAt(x, y, candidate.count, viewport, obstacles, placedRects, gap)
      ? null
      : { x, y };

  const center = tryAt(candidate.x, candidate.y);
  if (center) return center;

  for (const { dx, dy } of PREF_OFFSET_DIRECTIONS) {
    for (let step = 1; step <= PREFECTURE_BADGE_OFFSET_MAX_PX; step += 1) {
      const offset = tryAt(
        candidate.x + dx * step,
        candidate.y + dy * step,
      );
      if (offset) return offset;
    }
  }

  const snapped = clampBadgeCenterIntoViewport(
    candidate.x,
    candidate.y,
    candidate.count,
    viewport,
  );
  if (
    (snapped.x !== candidate.x || snapped.y !== candidate.y) &&
    !badgeBlockedAt(
      snapped.x,
      snapped.y,
      candidate.count,
      viewport,
      obstacles,
      placedRects,
      gap,
    )
  ) {
    return snapped;
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
    const kyotoAnchor = { ...kyoto, x: kyoto.x, y: kyoto.y - delta };
    const kyotoPos = findPrefectureBadgePosition(
      kyotoAnchor,
      viewport,
      obstacles,
      otherRects,
      gap,
    );
    if (!kyotoPos) continue;
    const kyotoRect = badgeRectAt(kyotoPos.x, kyotoPos.y, kyoto.count);
    const osakaAnchor = { ...osaka, x: osaka.x, y: osaka.y + delta };
    const osakaPos = findPrefectureBadgePosition(
      osakaAnchor,
      viewport,
      obstacles,
      [...otherRects, kyotoRect],
      gap,
    );
    if (!osakaPos) continue;
    placed[kyotoIndex] = { ...kyoto, ...kyotoPos };
    placedRects[kyotoIndex] = kyotoRect;
    placed.push({ ...osaka, ...osakaPos });
    placedRects.push(badgeRectAt(osakaPos.x, osakaPos.y, osaka.count));
    return true;
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
    placedRects.push(badgeRectAt(position.x, position.y, osaka.count));
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

  return false;
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
  gap = BADGE_GAP,
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
        badgeRectAt(position.x, position.y, candidate.count),
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
