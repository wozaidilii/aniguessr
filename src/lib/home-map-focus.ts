import type { HomeMapLabel, HomeMapLabels } from "~/lib/home-map-labels";

/** A work whose spots stretch this far is treated as nationwide. */
export const COUNTRY_LNG_SPAN = 6;
export const COUNTRY_LAT_SPAN = 5;

/** Keep at least this share of a work's spots when trimming a nationwide bbox. */
const FOCUS_KEEP_RATIO = 0.8;

const AREA_MAJOR = 150;
const PREFECTURE_MAJOR = 1500;

const PREFECTURE_BY_CODE: Record<string, string> = {
  "01": "hokkaido",
  "02": "aomori",
  "03": "iwate",
  "04": "miyagi",
  "05": "akita",
  "06": "yamagata",
  "07": "fukushima",
  "08": "ibaraki",
  "09": "tochigi",
  "10": "gunma",
  "11": "saitama",
  "12": "chiba",
  "13": "tokyo",
  "14": "kanagawa",
  "15": "niigata",
  "16": "toyama",
  "17": "ishikawa",
  "18": "fukui",
  "19": "yamanashi",
  "20": "nagano",
  "21": "gifu",
  "22": "shizuoka",
  "23": "aichi",
  "24": "mie",
  "25": "shiga",
  "26": "kyoto",
  "27": "osaka",
  "28": "hyogo",
  "29": "nara",
  "30": "wakayama",
  "31": "tottori",
  "32": "shimane",
  "33": "okayama",
  "34": "hiroshima",
  "35": "yamaguchi",
  "36": "tokushima",
  "37": "kagawa",
  "38": "ehime",
  "39": "kochi",
  "40": "fukuoka",
  "41": "saga",
  "42": "nagasaki",
  "43": "kumamoto",
  "44": "oita",
  "45": "miyazaki",
  "46": "kagoshima",
  "47": "okinawa",
};

const PREFECTURE_IDS = new Set(Object.values(PREFECTURE_BY_CODE));

export interface MapPoint {
  lng: number;
  lat: number;
}

export interface FocusSpot extends MapPoint {
  locationSlug: string;
}

export interface WorkFocusFrame {
  west: number;
  south: number;
  east: number;
  north: number;
  spansCountry: boolean;
  points: MapPoint[];
}

export function prefectureKey(slug: string): string {
  const suffix = slug.split("-").at(-1) ?? "";
  if (PREFECTURE_IDS.has(suffix)) return suffix;
  if (/^\d{5}$/u.test(suffix)) {
    return PREFECTURE_BY_CODE[suffix.slice(0, 2)] ?? "";
  }
  return "";
}

export function bboxSpansCountry(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}): boolean {
  return (
    bounds.east - bounds.west >= COUNTRY_LNG_SPAN ||
    bounds.north - bounds.south >= COUNTRY_LAT_SPAN
  );
}

/** Zoom floor of 5 only when the fitted spots still span the country. */
export function focusZoom(cameraZoom: number, spansCountry: boolean): number {
  return spansCountry ? Math.max(5, cameraZoom) : cameraZoom;
}

function centerOf(points: readonly MapPoint[]): { lng: number; lat: number } {
  const lngs = points.map((point) => point.lng).sort((a, b) => a - b);
  const lats = points.map((point) => point.lat).sort((a, b) => a - b);
  const mid = Math.floor(points.length / 2);
  return { lng: lngs[mid] ?? 0, lat: lats[mid] ?? 0 };
}

function squaredDistance(point: MapPoint, lng: number, lat: number): number {
  const dx = point.lng - lng;
  const dy = point.lat - lat;
  return dx * dx + dy * dy;
}

/** A few distant spots around a tight cluster, beyond the nationwide test. */
function hasOutlier(points: readonly MapPoint[]): boolean {
  if (points.length < 5) return false;
  const center = centerOf(points);
  const ranked = points
    .map((point) => squaredDistance(point, center.lng, center.lat))
    .sort((a, b) => a - b);
  const coreIndex = Math.min(
    ranked.length - 1,
    Math.ceil(ranked.length * FOCUS_KEEP_RATIO) - 1,
  );
  const core = ranked[coreIndex] ?? 0;
  const far = ranked[ranked.length - 1] ?? 0;
  return far > Math.max(core * 4, 0.12);
}

function spanOf(points: readonly MapPoint[]): Omit<WorkFocusFrame, "spansCountry" | "points"> {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const point of points) {
    west = Math.min(west, point.lng);
    east = Math.max(east, point.lng);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  }
  return { west, south, east, north };
}

/**
 * Bounds for fitBounds. A handful of distant spots must not pull a
 * Tokyo-heavy work out to a nationwide view. Trim the farthest spots
 * while the box spans the country or one spot sits far outside the
 * main cluster, and always keep at least 80%.
 */
export function workFocusFrame(spots: readonly MapPoint[]): WorkFocusFrame | null {
  const points = spots.filter(
    (spot) => Number.isFinite(spot.lng) && Number.isFinite(spot.lat),
  );
  if (points.length === 0) return null;
  const current = points.slice();
  const minKeep = Math.max(1, Math.ceil(points.length * FOCUS_KEEP_RATIO));
  while (
    current.length > minKeep &&
    (bboxSpansCountry(spanOf(current)) || hasOutlier(current))
  ) {
    const center = centerOf(current);
    let far = 0;
    let best = -1;
    for (let index = 0; index < current.length; index += 1) {
      const point = current[index];
      if (!point) continue;
      const distance = squaredDistance(point, center.lng, center.lat);
      if (distance > best) {
        best = distance;
        far = index;
      }
    }
    current.splice(far, 1);
  }
  const box = spanOf(current);
  return {
    ...box,
    spansCountry: bboxSpansCountry(box),
    points: current,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function round5(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function labelFromPoints(
  base: HomeMapLabel | undefined,
  id: string,
  points: MapPoint[],
  majorAt: number,
): HomeMapLabel {
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  return {
    id,
    ja: base?.ja ?? id,
    zh: base?.zh ?? base?.ja ?? id,
    tw: base?.tw ?? base?.ja ?? id,
    en: base?.en ?? base?.ja ?? id,
    count: points.length,
    lng: round5(median(lngs)),
    lat: round5(median(lats)),
    west: round5(Math.min(...lngs)),
    south: round5(Math.min(...lats)),
    east: round5(Math.max(...lngs)),
    north: round5(Math.max(...lats)),
    major: points.length >= majorAt,
  };
}

/**
 * Area and prefecture pills for one work. Groups with no spots are omitted,
 * so a filtered map does not keep the all-works counts.
 */
export function aggregateFocusedLabels(
  base: HomeMapLabels,
  spots: readonly FocusSpot[],
): HomeMapLabels {
  const areas = new Map(base.areas.map((label) => [label.id, label]));
  const prefectures = new Map(base.prefectures.map((label) => [label.id, label]));
  const areaPoints = new Map<string, MapPoint[]>();
  const prefecturePoints = new Map<string, MapPoint[]>();
  for (const spot of spots) {
    if (!Number.isFinite(spot.lng) || !Number.isFinite(spot.lat)) continue;
    const point = { lng: spot.lng, lat: spot.lat };
    const area = areaPoints.get(spot.locationSlug) ?? [];
    area.push(point);
    areaPoints.set(spot.locationSlug, area);
    const prefecture = prefectureKey(spot.locationSlug);
    if (!prefecture) continue;
    const group = prefecturePoints.get(prefecture) ?? [];
    group.push(point);
    prefecturePoints.set(prefecture, group);
  }
  const nextAreas = [...areaPoints.entries()].map(([id, points]) =>
    labelFromPoints(areas.get(id), id, points, AREA_MAJOR),
  );
  const nextPrefectures = [...prefecturePoints.entries()].map(([id, points]) =>
    labelFromPoints(prefectures.get(id), id, points, PREFECTURE_MAJOR),
  );
  nextAreas.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  nextPrefectures.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  return { version: 1, areas: nextAreas, prefectures: nextPrefectures };
}
