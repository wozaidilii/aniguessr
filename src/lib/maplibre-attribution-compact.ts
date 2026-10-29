import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * MapLibre compact attribution: `maplibregl-compact-show` is the collapsed (i) state.
 * Collapse after MapLibre's resize handler so the toggle is not inverted.
 */
export function collapseMapLibreAttribution(map: MapLibreMap): void {
  const root = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
  if (!root) return;
  if (!("classList" in root) || !("removeAttribute" in root)) return;
  root.classList.add("maplibregl-compact");
  root.classList.add("maplibregl-compact-show");
  root.removeAttribute("open");
}

/** Run collapse after MapLibre attribution compact logic (resize / idle). */
export function scheduleCollapseMapLibreAttribution(map: MapLibreMap): void {
  const collapse = (): void => collapseMapLibreAttribution(map);
  requestAnimationFrame(() => {
    requestAnimationFrame(collapse);
  });
  void map.once("idle", collapse);
  void map.once("resize", collapse);
}
