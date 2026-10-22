import { readFileSync } from "node:fs";

const CELL = 0.5;

/** @type {{ places: Municipality[], grid: Map<string, Municipality[]> } | null} */
let index = null;

/**
 * @typedef {object} Municipality
 * @property {string} code
 * @property {string} slug
 * @property {string} ja
 * @property {string} en
 * @property {string} zh
 * @property {number[]} bbox
 * @property {number[][]} rings
 */

function cellKey(lng, lat) {
  return `${Math.floor(lng / CELL)}:${Math.floor(lat / CELL)}`;
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  const count = ring.length / 2;
  let previous = count - 1;
  for (let index = 0; index < count; index += 1) {
    const xi = ring[index * 2];
    const yi = ring[index * 2 + 1];
    const xj = ring[previous * 2];
    const yj = ring[previous * 2 + 1];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
    previous = index;
  }
  return inside;
}

/** Load the offline municipality file used to reverse-geocode pilgrimage spots. */
export function loadMunicipalities(filePath) {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const places = Array.isArray(raw.places) ? raw.places : [];
  const grid = new Map();
  for (const place of places) {
    const [minLng, minLat, maxLng, maxLat] = place.bbox;
    const x0 = Math.floor(minLng / CELL);
    const x1 = Math.floor(maxLng / CELL);
    const y0 = Math.floor(minLat / CELL);
    const y1 = Math.floor(maxLat / CELL);
    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        const key = `${x}:${y}`;
        const list = grid.get(key);
        if (list) list.push(place);
        else grid.set(key, [place]);
      }
    }
  }
  index = { places, grid };
  return index;
}

function candidatesNear(lng, lat, radius) {
  const cx = Math.floor(lng / CELL);
  const cy = Math.floor(lat / CELL);
  const found = [];
  const seen = new Set();
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const list = index?.grid.get(`${cx + dx}:${cy + dy}`);
      if (!list) continue;
      for (const place of list) {
        if (seen.has(place.code)) continue;
        seen.add(place.code);
        found.push(place);
      }
    }
  }
  return found;
}

/**
 * Every municipality whose ring contains the point.
 * Unlike {@link locateMunicipality}, this does not snap a miss onto the shore.
 * @returns {Municipality[]}
 */
export function municipalitiesContaining(lng, lat) {
  if (!index || !Number.isFinite(lng) || !Number.isFinite(lat)) return [];
  const hits = [];
  for (const place of candidatesNear(lng, lat, 0)) {
    const [minLng, minLat, maxLng, maxLat] = place.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    for (const ring of place.rings) {
      if (pointInRing(lng, lat, ring)) {
        hits.push(place);
        break;
      }
    }
  }
  return hits;
}

function segmentDistanceMeters(lng, lat, ax, ay, bx, by) {
  const cos = Math.cos((lat * Math.PI) / 180);
  const mx = (x) => x * 111320 * cos;
  const my = (y) => y * 110540;
  const px = mx(lng);
  const py = my(lat);
  const x1 = mx(ax);
  const y1 = my(ay);
  const x2 = mx(bx);
  const y2 = my(by);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function roughBboxMeters(lng, lat, bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const cos = Math.cos((lat * Math.PI) / 180);
  const dx =
    lng < minLng
      ? (minLng - lng) * 111320 * cos
      : lng > maxLng
        ? (lng - maxLng) * 111320 * cos
        : 0;
  const dy =
    lat < minLat
      ? (minLat - lat) * 110540
      : lat > maxLat
        ? (lat - maxLat) * 110540
        : 0;
  return Math.hypot(dx, dy);
}

/**
 * Distance in meters from the point to the nearest ring of each nearby municipality.
 * @returns {{ place: Municipality, meters: number }[]}
 */
export function nearbyBoundaryDistances(lng, lat) {
  if (!index || !Number.isFinite(lng) || !Number.isFinite(lat)) return [];
  const found = [];
  for (const place of candidatesNear(lng, lat, 1)) {
    let best = Infinity;
    for (const ring of place.rings) {
      const count = ring.length / 2;
      for (let index = 0; index < count; index += 1) {
        const next = (index + 1) % count;
        const distance = segmentDistanceMeters(
          lng,
          lat,
          ring[index * 2],
          ring[index * 2 + 1],
          ring[next * 2],
          ring[next * 2 + 1],
        );
        if (distance < best) best = distance;
      }
    }
    if (Number.isFinite(best)) found.push({ place, meters: best });
  }
  found.sort((left, right) => left.meters - right.meters);
  return found;
}

/**
 * Meters to the nearest municipality in a different prefecture.
 * A large value means the point is not on a prefecture border.
 * @param {string} prefCode two-digit JIS prefecture code
 */
export function distanceToOtherPrefecture(lng, lat, prefCode) {
  if (!index || !Number.isFinite(lng) || !Number.isFinite(lat)) return Infinity;
  let best = Infinity;
  for (const place of candidatesNear(lng, lat, 1)) {
    if (place.code.slice(0, 2) === prefCode) continue;
    if (roughBboxMeters(lng, lat, place.bbox) >= best) continue;
    for (const ring of place.rings) {
      const count = ring.length / 2;
      for (let index = 0; index < count; index += 1) {
        const next = (index + 1) % count;
        const distance = segmentDistanceMeters(
          lng,
          lat,
          ring[index * 2],
          ring[index * 2 + 1],
          ring[next * 2],
          ring[next * 2 + 1],
        );
        if (distance < best) best = distance;
      }
    }
  }
  return best;
}

/** Exact ring hit. Does not snap sea points back onto the shore. */
function containsMunicipality(lng, lat) {
  if (!index) return false;
  for (const place of candidatesNear(lng, lat, 0)) {
    const [minLng, minLat, maxLng, maxLat] = place.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    for (const ring of place.rings) {
      if (pointInRing(lng, lat, ring)) return true;
    }
  }
  return false;
}

/**
 * True when a step outward from the municipality leaves land.
 * Inland borders step into a neighbor; a coast steps into the sea.
 * @param {Municipality | null | undefined} place
 */
export function municipalityTouchesSea(place) {
  if (!index || !place?.rings?.length) return false;
  const gap = 0.025;
  for (const ring of place.rings) {
    if (ring.length < 6) continue;
    let cx = 0;
    let cy = 0;
    const count = ring.length / 2;
    for (let index = 0; index < count; index += 1) {
      cx += ring[index * 2];
      cy += ring[index * 2 + 1];
    }
    cx /= count;
    cy /= count;
    const stride = Math.max(1, Math.floor(count / 28));
    for (let index = 0; index < count; index += stride) {
      const lng = ring[index * 2];
      const lat = ring[index * 2 + 1];
      const dx = lng - cx;
      const dy = lat - cy;
      const length = Math.hypot(dx, dy) || 1;
      const x = lng + (dx / length) * gap;
      const y = lat + (dy / length) * gap;
      if (!containsMunicipality(x, y)) return true;
    }
  }
  return false;
}

/**
 * Distance in meters from the point to the nearest ring of one municipality.
 * @param {Municipality} place
 */
export function distanceToMunicipality(lng, lat, place) {
  if (!place) return Infinity;
  let best = Infinity;
  if (roughBboxMeters(lng, lat, place.bbox) >= best) return best;
  for (const ring of place.rings) {
    const count = ring.length / 2;
    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      const distance = segmentDistanceMeters(
        lng,
        lat,
        ring[index * 2],
        ring[index * 2 + 1],
        ring[next * 2],
        ring[next * 2 + 1],
      );
      if (distance < best) best = distance;
    }
  }
  return best;
}

/**
 * Meters to the nearest municipality other than `code`.
 * A large value means the point is not on that municipality's border.
 */
export function distanceToOtherMunicipality(lng, lat, code) {
  if (!index || !Number.isFinite(lng) || !Number.isFinite(lat)) return Infinity;
  let best = Infinity;
  for (const place of candidatesNear(lng, lat, 1)) {
    if (place.code === code) continue;
    if (roughBboxMeters(lng, lat, place.bbox) >= best) continue;
    const distance = distanceToMunicipality(lng, lat, place);
    if (distance < best) best = distance;
  }
  return best;
}

/**
 * Municipality containing this coordinate.
 * Points that fall just outside a simplified coastline use the nearest boundary.
 * @returns {Municipality | null}
 */
export function locateMunicipality(lng, lat) {
  if (!index) return null;
  for (const place of candidatesNear(lng, lat, 0)) {
    const [minLng, minLat, maxLng, maxLat] = place.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    for (const ring of place.rings) {
      if (pointInRing(lng, lat, ring)) return place;
    }
  }

  let best = null;
  let bestDistance = 0.12 * 0.12;
  for (const place of candidatesNear(lng, lat, 1)) {
    for (const ring of place.rings) {
      for (let index = 0; index < ring.length; index += 2) {
        const dLng = lng - ring[index];
        const dLat = (lat - ring[index + 1]) * 1.15;
        const distance = dLng * dLng + dLat * dLat;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = place;
        }
      }
    }
  }
  return best;
}
