/**
 * Decorative map geometry. Pins use real relative positions.
 * The coastline and streets are not real terrain and are not map tiles.
 */

export type MapArt = "coast" | "city";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MarkerPoint {
  x: number;
  y: number;
}

export interface MarkerCluster extends MarkerPoint {
  n: number;
}

export interface MarkerLayout {
  art: MapArt;
  minorPins: MarkerPoint[];
  pins: MarkerPoint[];
  activePin?: MarkerPoint;
  clusters: MarkerCluster[];
}

export const PANEL_X = 470;
export const SPOT_PIN = { x: 445, y: 321 };
export const PX_PER_KM = 180;
export const NEARBY_KM = 2;
export const NEARBY_MAX = 8;
export const CLUSTER_PX = 80;
/** Same real-world pin shared by more than one work. */
export const SAME_PLACE_METERS = 30;

const FOCUS = {
  coast: { x0: 240, x1: 700, y0: 100, y1: 335 },
  city: { x0: 240, x1: 700, y0: 90, y1: 560 },
} as const;

const SPOT_FOCUS = { x0: 240, x1: 700, y0: 100, y1: 560 };

const KM_PER_DEG = 111.32;

const DEFS = `<defs>
 <radialGradient id="seaG" cx="40%" cy="100%" r="90%"><stop offset="0" stop-color="#10284a"/><stop offset="1" stop-color="#0a1630"/></radialGradient>
 <linearGradient id="landG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1530"/><stop offset="1" stop-color="#211a38"/></linearGradient>
 <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>`;

const COAST = `<g transform="scale(.73) translate(-330 -150)">
  <rect x="-200" y="-200" width="2400" height="1600" fill="url(#seaG)"/>
  <g fill="none" stroke="#1a3a63" stroke-width="1.4" opacity=".55">
   <path d="M-100 760 C200 740 420 800 620 760 S1000 720 1300 770 1700 760 1800 760"/>
   <path d="M-100 860 C240 840 460 900 680 860 S1040 820 1320 870 1700 860 1800 860"/>
   <path d="M-100 980 C260 960 500 1010 720 975 S1080 940 1340 985 1700 980 1800 980"/></g>
  <path d="M-200 -200 H1800 V640 C1700 650 1640 620 1560 628 C1500 634 1440 660 1380 655 C1320 650 1290 625 1250 640 C1215 655 1190 690 1150 680 C1110 668 1100 630 1060 618 C1000 600 940 612 880 596 C820 582 780 560 720 566 C660 572 620 590 560 586 C510 584 470 570 420 578 C330 590 220 600 100 596 C20 594 -60 600 -200 600 Z" fill="url(#landG)"/>
  <path d="M100 596 C220 600 330 590 420 578 C470 570 510 584 560 586" fill="none" stroke="#3b3256" stroke-width="7" stroke-linecap="round" opacity=".7"/>
  <path d="M1250 640 C1290 625 1320 650 1380 655 C1440 660 1500 634 1560 628" fill="none" stroke="#3b3256" stroke-width="7" stroke-linecap="round" opacity=".7"/>
  <g fill="#18233a" opacity=".9"><path d="M900 330 C980 260 1100 280 1160 340 C1220 400 1150 470 1060 470 C960 470 840 420 900 330Z"/>
   <path d="M1180 170 C1260 120 1420 140 1480 220 C1530 300 1420 360 1320 340 C1220 320 1120 230 1180 170Z"/>
   <path d="M560 300 C620 250 720 260 760 320 C790 380 720 420 650 410 C580 400 520 350 560 300Z"/>
   <path d="M1240 470 C1290 440 1360 450 1380 500 C1395 545 1330 570 1280 560 C1230 550 1200 500 1240 470Z"/></g>
  <g fill="none" stroke="#2c2647" stroke-width="4">
   <path d="M-200 520 C100 515 300 530 450 545 C600 555 760 540 900 560 C1050 580 1180 600 1300 610 C1420 618 1560 600 1800 590"/>
   <path d="M600 -200 C620 100 700 200 760 300 C820 400 820 500 830 580"/>
   <path d="M1060 -200 C1040 100 1100 220 1180 300 C1260 380 1360 410 1420 430"/>
   <path d="M1420 -200 C1400 100 1440 300 1420 430 C1410 520 1380 580 1360 640"/>
   <path d="M-200 300 C100 290 200 260 320 250 C500 240 640 230 760 300"/></g>
  <g fill="none" stroke="#241f3c" stroke-width="2"><path d="M1300 520 C1360 500 1450 520 1560 500"/><path d="M1500 100 C1520 260 1560 380 1580 560"/><path d="M700 460 C760 470 820 450 900 480"/></g>
  <path d="M300 300 C320 420 360 520 450 552 C560 560 640 548 720 548 C820 548 900 570 1000 582 C1120 596 1200 600 1260 590 C1340 570 1400 500 1420 430" fill="none" stroke="#67e8f9" stroke-width="3.5" stroke-dasharray="12 8" opacity=".55"/>
  <path d="M470 600 L480 680" stroke="#2c2647" stroke-width="6"/>
  <path d="M440 700 C450 670 510 664 540 684 C570 704 556 744 514 750 C470 756 430 730 440 700Z" fill="url(#landG)" stroke="#3b3256" stroke-width="3"/>
 </g>`;

function cityArt(): string {
  const roads = [
    ...Array.from({ length: 9 }, (_, index) => `<path d="M-100 ${index * 80} H850"/>`),
    ...Array.from(
      { length: 10 },
      (_, index) => `<path d="M${index * 90} -100 V750"/>`,
    ),
  ].join("");
  return `<rect width="730" height="630" fill="url(#landG)"/>
  <path d="M-20 470 C120 430 220 500 360 470 S600 380 760 420" fill="none" stroke="#10284a" stroke-width="34"/>
  <path d="M-20 470 C120 430 220 500 360 470 S600 380 760 420" fill="none" stroke="#1a3a63" stroke-width="2" opacity=".6"/>
  <g fill="#18233a" opacity=".9"><path d="M420 80 C480 40 600 60 630 130 C650 190 560 220 500 210 C430 200 380 130 420 80Z"/><path d="M150 560 C200 520 300 530 320 580 L330 650 L130 650Z"/></g>
  <g fill="none" stroke="#2c2647" stroke-width="3" transform="rotate(-8 365 315)">${roads}</g>
  <path d="M-20 160 C160 200 300 250 400 320 C480 380 600 360 760 300" fill="none" stroke="#67e8f9" stroke-width="3.5" stroke-dasharray="12 8" opacity=".55"/>`;
}

const PIN = `<path d="M0 0c-9-11-14-18-14-25a14 14 0 0 1 28 0c0 7-5 14-14 25z" fill="#f9a8d4" stroke="#0a0612" stroke-width="2.5"/><circle cy="-25" r="5" fill="#0a0612"/>`;
const PIN_S = `<path d="M0 0c-6-8-10-12-10-18a10 10 0 0 1 20 0c0 6-4 10-10 18z" fill="#f9a8d4" stroke="#0a0612" stroke-width="2" opacity=".75"/>`;

export function clusterRadius(count: number): number {
  if (count >= 100) return 34;
  if (count >= 10) return 29;
  return 24;
}

export function otherWorkCounts<T extends LatLng & { id: string; workId: string }>(
  spots: readonly T[],
): Map<string, number> {
  const cell = 0.00045;
  const grid = new Map<string, T[]>();
  const bucketKey = (lat: number, lng: number) =>
    `${Math.floor(lat / cell)}:${Math.floor(lng / cell)}`;
  for (const spot of spots) {
    const key = bucketKey(spot.lat, spot.lng);
    const list = grid.get(key);
    if (list) list.push(spot);
    else grid.set(key, [spot]);
  }
  const counts = new Map<string, number>();
  for (const spot of spots) {
    const cx = Math.floor(spot.lat / cell);
    const cy = Math.floor(spot.lng / cell);
    const works = new Set<string>([spot.workId]);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const bucket = grid.get(`${cx + dx}:${cy + dy}`);
        if (!bucket) continue;
        for (const other of bucket) {
          if (other.workId === spot.workId) continue;
          if (haversineMeters(spot, other) <= SAME_PLACE_METERS) works.add(other.workId);
        }
      }
    }
    counts.set(spot.id, works.size - 1);
  }
  return counts;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const radius = 6_371_000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const dφ = ((b.lat - a.lat) * Math.PI) / 180;
  const dλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function projectToFocus(points: LatLng[], art: MapArt): MarkerPoint[] {
  if (points.length === 0) return [];
  const lats = points.map((point) => point.lat);
  const midLat = ((Math.min(...lats) + Math.max(...lats)) / 2) * (Math.PI / 180);
  const cos = Math.cos(midLat);
  const raw = points.map((point) => ({ x: point.lng * cos, y: -point.lat }));
  let minX = Math.min(...raw.map((point) => point.x));
  let maxX = Math.max(...raw.map((point) => point.x));
  let minY = Math.min(...raw.map((point) => point.y));
  let maxY = Math.max(...raw.map((point) => point.y));
  const padX = (maxX - minX) * 0.15 || 0.01;
  const padY = (maxY - minY) * 0.15 || 0.01;
  minX -= padX;
  maxX += padX;
  minY -= padY;
  maxY += padY;
  const focus = FOCUS[art];
  const scale = Math.min(
    (focus.x1 - focus.x0) / (maxX - minX),
    (focus.y1 - focus.y0) / (maxY - minY),
  );
  const contentW = (maxX - minX) * scale;
  const contentH = (maxY - minY) * scale;
  const originX = focus.x0 + (focus.x1 - focus.x0 - contentW) / 2;
  const originY = focus.y0 + (focus.y1 - focus.y0 - contentH) / 2;
  return raw.map((point) => ({
    x: round(originX + (point.x - minX) * scale),
    y: round(originY + (point.y - minY) * scale),
  }));
}

/** Extra pixels required between cluster edges so "19" and "12" cannot read as "1912". */
const CLUSTER_GAP = 8;

/**
 * After the 80px grid, neighboring cells can still sit on top of each other.
 * Merge those clusters: sum the counts and keep a count-weighted center.
 * Singles are not passed in, so a lone pin is never absorbed.
 */
export function mergeOverlappingClusters(
  clusters: readonly MarkerCluster[],
): MarkerCluster[] {
  const pending = clusters.map((item) => ({ ...item }));
  const merged: MarkerCluster[] = [];
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current) break;
    let grew = true;
    while (grew) {
      grew = false;
      for (let index = pending.length - 1; index >= 0; index -= 1) {
        const other = pending[index];
        if (!other) continue;
        const distance = Math.hypot(current.x - other.x, current.y - other.y);
        const limit =
          clusterRadius(current.n) + clusterRadius(other.n) + CLUSTER_GAP;
        if (distance >= limit) continue;
        const total = current.n + other.n;
        current.x = round((current.x * current.n + other.x * other.n) / total);
        current.y = round((current.y * current.n + other.y * other.n) / total);
        current.n = total;
        pending.splice(index, 1);
        grew = true;
      }
    }
    merged.push(current);
  }
  return merged;
}

export function clusterMarkers(points: MarkerPoint[]): {
  singles: MarkerPoint[];
  clusters: MarkerCluster[];
} {
  const buckets = new Map<string, MarkerPoint[]>();
  for (const point of points) {
    const key = `${Math.floor(point.x / CLUSTER_PX)}:${Math.floor(point.y / CLUSTER_PX)}`;
    const list = buckets.get(key);
    if (list) list.push(point);
    else buckets.set(key, [point]);
  }
  const singles: MarkerPoint[] = [];
  const clusters: MarkerCluster[] = [];
  for (const group of buckets.values()) {
    const x = round(group.reduce((sum, point) => sum + point.x, 0) / group.length);
    const y = round(group.reduce((sum, point) => sum + point.y, 0) / group.length);
    if (group.length > 1) clusters.push({ x, y, n: group.length });
    else singles.push({ x, y });
  }
  return { singles, clusters };
}

export function layoutWorkMarkers(points: LatLng[], art: MapArt): MarkerLayout {
  const projected = projectToFocus(points, art);
  if (projected.length <= 12) {
    return { art, minorPins: [], pins: projected, clusters: [] };
  }
  const grouped = clusterMarkers(projected);
  return {
    art,
    minorPins: grouped.singles,
    pins: [],
    clusters: mergeOverlappingClusters(grouped.clusters),
  };
}

export function layoutAreaMarkers(points: LatLng[], art: MapArt): MarkerLayout {
  const grouped = clusterMarkers(projectToFocus(points, art));
  return {
    art,
    minorPins: grouped.singles,
    pins: [],
    clusters: mergeOverlappingClusters(grouped.clusters),
  };
}

export function layoutSpotMarkers(
  origin: LatLng,
  nearby: LatLng[],
  art: MapArt,
): MarkerLayout {
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  const ranked = nearby
    .map((point) => {
      const dxKm = (point.lng - origin.lng) * cos * KM_PER_DEG;
      const dyKm = (point.lat - origin.lat) * KM_PER_DEG;
      const distance = Math.hypot(dxKm, dyKm);
      return {
        distance,
        x: SPOT_PIN.x + dxKm * PX_PER_KM,
        y: SPOT_PIN.y - dyKm * PX_PER_KM,
      };
    })
    .filter(
      (point) =>
        point.distance > 0 &&
        point.distance <= NEARBY_KM &&
        point.x >= SPOT_FOCUS.x0 &&
        point.x <= SPOT_FOCUS.x1 &&
        point.y >= SPOT_FOCUS.y0 &&
        point.y <= SPOT_FOCUS.y1,
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEARBY_MAX);
  return {
    art,
    minorPins: ranked.map((point) => ({ x: round(point.x), y: round(point.y) })),
    pins: [],
    activePin: { ...SPOT_PIN },
    clusters: [],
  };
}

function clusterCircle(cluster: MarkerCluster): string {
  const radius = clusterRadius(cluster.n);
  return `<circle cx="${cluster.x}" cy="${cluster.y}" r="${radius + 11}" fill="#f9a8d4" opacity=".25"/><circle cx="${cluster.x}" cy="${cluster.y}" r="${radius}" fill="#f9a8d4" stroke="#0a0612" stroke-width="3"/>`;
}

export function buildMapSvg(layout: MarkerLayout): string {
  const minor = layout.minorPins
    .map((point) => `<g transform="translate(${point.x} ${point.y})">${PIN_S}</g>`)
    .join("");
  const clusters = layout.clusters.map(clusterCircle).join("");
  const pins = layout.pins
    .map(
      (point) =>
        `<g transform="translate(${point.x} ${point.y}) scale(1.25)">${PIN}</g>`,
    )
    .join("");
  const active = layout.activePin
    ? `<circle cx="${layout.activePin.x}" cy="${layout.activePin.y - 38}" r="46" fill="#f9a8d4" opacity=".35" filter="url(#glow)"/><ellipse cx="${layout.activePin.x}" cy="${layout.activePin.y + 2}" rx="22" ry="7" fill="#000" opacity=".45"/><g transform="translate(${layout.activePin.x} ${layout.activePin.y}) scale(2.3)">${PIN}</g>`
    : "";
  const art = layout.art === "coast" ? COAST : cityArt();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="730" height="630" viewBox="0 0 730 630">${DEFS}${art}${minor}${clusters}${pins}${active}</svg>`;
}

export const PIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f9a8d4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
