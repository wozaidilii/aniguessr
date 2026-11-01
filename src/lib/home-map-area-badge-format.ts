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

export function areaBadgeHref(labelId: string, locale: HomeLocale): string {
  return withPilgrimageLocale(`/pilgrimage/locations/${labelId}`, locale);
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

function rectsOverlap(a: AxisRect, b: AxisRect, gap: number): boolean {
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

function badgeRectAt(centerX: number, centerY: number, count: number): AxisRect {
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

/** Prefecture pills: zoom in [0, 7). Area pills: [7, 12). */
export function homeMapAreaBadgeZoomBand(zoom: number): "pref" | "area" | "none" {
  if (zoom >= 12) return "none";
  if (zoom >= 7) return "area";
  return "pref";
}
