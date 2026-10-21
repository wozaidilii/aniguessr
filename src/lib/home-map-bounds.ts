/**
 * Default homepage camera: Kanto / Shonan.
 * Kamakura, Enoshima, and central Tokyo stay inside.
 * Harbin and the Korean peninsula stay outside.
 */
export const KANTO_SHONAN_BOUNDS: [[number, number], [number, number]] = [
  [139.28, 35.13],
  [139.98, 35.82],
];

export const KANTO_INITIAL_CENTER: [number, number] = [139.63, 35.475];

/** Used only when fitBounds cannot run. Already framed on Kanto. */
export const KANTO_INITIAL_ZOOM = 9;

export function kantoBoundsContain(lng: number, lat: number): boolean {
  const [[west, south], [east, north]] = KANTO_SHONAN_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}
