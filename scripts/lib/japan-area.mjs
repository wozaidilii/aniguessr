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
