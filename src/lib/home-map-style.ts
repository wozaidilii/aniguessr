import type { ExpressionSpecification, Map } from "maplibre-gl";
import type { HomeLocale } from "~/lib/home-locale";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

/** Map overlay layers (pills, clusters, spot labels) — never retune like OSM place labels. */
export function isHomeMapOverlayLayerId(layerId: string): boolean {
  return layerId.startsWith("home-");
}

/** Light OpenFreeMap fallback while Google tiles load or on error. */
export const HOME_MAP_STYLE = OPENFREEMAP_POSITRON_STYLE;

export const HOME_IDEOGRAPH_FONT =
  "Hiragino Sans, Noto Sans CJK JP, Noto Sans JP, Yu Gothic, Meiryo, sans-serif";

const PLACE_LABEL_LAYERS = new Set([
  "label_city",
  "label_city_capital",
  "label_town",
  "label_village",
  "label_state",
]);

export function homePlaceNameKey(locale: HomeLocale): string {
  if (locale === "zh") return "name:zh";
  if (locale === "zh-tw") return "name:zh-Hant";
  if (locale === "en") return "name:en";
  return "name:ja";
}

export function homePlaceNameField(
  locale: HomeLocale,
): ExpressionSpecification {
  return ["coalesce", ["get", homePlaceNameKey(locale)], ["get", "name"]];
}

function isShieldLayer(id: string): boolean {
  return /shield/i.test(id);
}

function setPaint(map: Map, id: string, name: string, value: unknown): void {
  try {
    map.setPaintProperty(id, name, value);
  } catch {
    // A basemap layer can omit the property. Leave that layer alone.
  }
}

/** Point place names at the page locale and quiet the city labels and water. */
export function tuneHomeMapStyle(
  map: Map,
  locale: HomeLocale,
  options?: { skip?: boolean },
): void {
  if (options?.skip) return;
  const field = homePlaceNameField(locale);
  const style = map.getStyle();
  for (const layer of style.layers ?? []) {
    if (layer.id === "water" && layer.type === "fill") {
      setPaint(map, layer.id, "fill-color", "#dce9f1");
    }
    if (layer.id === "waterway" && layer.type === "line") {
      setPaint(map, layer.id, "line-color", "#dce9f1");
    }
    if (layer.type !== "symbol" || isShieldLayer(layer.id)) continue;
    if (isHomeMapOverlayLayerId(layer.id)) continue;
    if (
      layer.layout &&
      "text-field" in layer.layout &&
      layer.layout["text-field"]
    ) {
      try {
        map.setLayoutProperty(layer.id, "text-field", field);
      } catch {
        // Shield-like symbols without a writable text field stay as published.
      }
    }
    if (!PLACE_LABEL_LAYERS.has(layer.id)) continue;
    setPaint(map, layer.id, "text-color", "#4a4452");
    setPaint(map, layer.id, "text-halo-color", "#ffffff");
    setPaint(map, layer.id, "text-halo-width", 1.4);
  }
}
