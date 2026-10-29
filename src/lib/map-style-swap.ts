import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

export type MapStyleInput = string | StyleSpecification;

/**
 * Applies a full style swap and invokes `onReady` once MapLibre reports the
 * style is usable (style.load and idle as a fallback when load is skipped).
 */
export function swapMapStyle(
  map: MapLibreMap,
  style: MapStyleInput,
  onReady: () => void,
): void {
  let finished = false;
  const finish = (): void => {
    if (finished) return;
    finished = true;
    onReady();
  };
  void map.once("style.load", finish);
  void map.once("idle", finish);
  void map.setStyle(style, { diff: false });
}

export function swapMapStyleUrl(
  map: MapLibreMap,
  styleUrl: string,
  onReady: () => void,
): void {
  swapMapStyle(map, styleUrl, onReady);
}
