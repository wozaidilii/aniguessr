import type { Map as MapLibreMap } from "maplibre-gl";

/** MapLibre compact attribution starts expanded; collapse so it does not cover controls. */
export function collapseMapLibreAttribution(map: MapLibreMap): void {
  const root = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
  if (!root) return;
  root.classList.remove("maplibregl-compact-show");
  const toggle = root.querySelector("button");
  toggle?.setAttribute("aria-expanded", "false");
}
