import type { Map as MapLibreMap } from "maplibre-gl";

/** Collapsed compact attribution: no compact-show, details closed (matches MapLibre toggle). */
export function collapseMapLibreAttribution(map: MapLibreMap): void {
  const root = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
  if (!root) return;
  if (!("classList" in root) || !("removeAttribute" in root)) return;
  root.classList.add("maplibregl-compact");
  root.classList.remove("maplibregl-compact-show");
  root.removeAttribute("open");
}

/** Run collapse after MapLibre attribution compact logic on add (not on every resize). */
export function scheduleCollapseMapLibreAttribution(map: MapLibreMap): void {
  const collapse = (): void => collapseMapLibreAttribution(map);
  requestAnimationFrame(() => {
    requestAnimationFrame(collapse);
  });
  void map.once("idle", collapse);
}
