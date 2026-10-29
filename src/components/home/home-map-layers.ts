import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map,
  SymbolLayerSpecification,
} from "maplibre-gl";
import {
  FAVORITE_CLUSTER_SUM,
  POINT_IS_FAVORITE,
  spotFavProperty,
} from "~/components/pilgrimage/pilgrimage-map-layers";
import type { HomeMapLabel } from "~/lib/home-map-labels";
import { homeMapLabelText } from "~/lib/home-map-labels";
import type { HomeLocale } from "~/lib/home-locale";
import type { NavCatalog, NavSpot } from "~/lib/pilgrimage-nav";
import { animeTitle, localizedSpotName } from "~/lib/pilgrimage-nav";

export const HOME_DOTS_SOURCE = "home-dots";
export const HOME_CLUSTER_SOURCE = "home-spots";
export const HOME_AREA_SOURCE = "home-areas";
export const HOME_PREF_SOURCE = "home-prefs";

const PILL_LAYERS = [
  "home-pref-minor",
  "home-pref-major",
  "home-area-minor",
  "home-area-major",
] as const;

export const HOME_PILL_LAYER_IDS: readonly string[] = PILL_LAYERS;

const SPOT_COLOR = "#E0488F";
/** Homepage favorite ring. The pilgrimage map keeps its own cyan. */
const HOME_FAVORITE_COLOR = "#0e8f8a";
const TEXT_FONT = ["Noto Sans Regular"];

type CirclePaint = NonNullable<CircleLayerSpecification["paint"]>;

function asExpr(value: readonly unknown[]): ExpressionSpecification {
  return value as unknown as ExpressionSpecification;
}

function asFilter(value: readonly unknown[]): FilterSpecification {
  return value as unknown as FilterSpecification;
}

const EMPTY: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function capsuleImage(major: boolean): ImageData {
  const ratio = 2;
  const width = 72;
  const height = 32;
  const canvas = document.createElement("canvas");
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not draw the map pill");
  }
  context.scale(ratio, ratio);
  const inset = 1.5;
  const x = inset;
  const y = inset;
  const w = width - inset * 2;
  const h = height - inset * 2;
  const radius = h / 2;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
  if (major) {
    context.fillStyle = "#F7A8D0";
    context.fill();
  } else {
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#E0488F";
    context.lineWidth = 1.6;
    context.stroke();
  }
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

const PILL_IMAGE_OPTIONS = {
  pixelRatio: 2,
  stretchX: [[48, 96]] as [number, number][],
  stretchY: [[20, 44]] as [number, number][],
  content: [40, 14, 104, 50] as [number, number, number, number],
};

export function addHomePillImages(map: Map): void {
  if (!map.hasImage("home-pill-major")) {
    map.addImage("home-pill-major", capsuleImage(true), PILL_IMAGE_OPTIONS);
  }
  if (!map.hasImage("home-pill-minor")) {
    map.addImage("home-pill-minor", capsuleImage(false), PILL_IMAGE_OPTIONS);
  }
}

function pillLayout(
  image: string,
  textSize: number,
): SymbolLayerSpecification["layout"] {
  return {
    "icon-image": image,
    "icon-text-fit": "both",
    "icon-text-fit-padding": [3, 9, 3, 9],
    "text-field": [
      "format",
      ["get", "label"],
      { "text-color": "#2a2430" },
      " ",
      {},
      ["to-string", ["get", "count"]],
      { "text-color": "#E0488F" },
    ],
    "text-font": TEXT_FONT,
    "text-size": textSize,
    "text-max-width": 24,
    "symbol-sort-key": ["*", ["get", "count"], -1],
    "icon-allow-overlap": false,
    "text-allow-overlap": false,
    "icon-ignore-placement": false,
    "text-ignore-placement": false,
  };
}

function addPillLayer(
  map: Map,
  id: string,
  source: string,
  image: string,
  textSize: number,
  major: boolean,
  minzoom: number,
  maxzoom: number,
) {
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: "symbol",
    source,
    minzoom,
    maxzoom,
    filter: ["==", ["get", "major"], major ? 1 : 0],
    layout: pillLayout(image, textSize),
  });
}

const POINT_RADIUS = asExpr([
  "interpolate",
  ["linear"],
  ["zoom"],
  12,
  3,
  16,
  6,
]);

const CLUSTER_RADIUS = asExpr([
  "step",
  ["get", "point_count"],
  9,
  10,
  11,
  50,
  13,
]);

const CLUSTER_RING_RADIUS = asExpr([
  "step",
  ["get", "point_count"],
  13,
  10,
  15,
  50,
  17,
]);

export function installHomeMapLayers(map: Map): void {
  addHomePillImages(map);
  if (!map.getSource(HOME_DOTS_SOURCE)) {
    map.addSource(HOME_DOTS_SOURCE, { type: "geojson", data: EMPTY });
  }
  if (!map.getSource(HOME_CLUSTER_SOURCE)) {
    map.addSource(HOME_CLUSTER_SOURCE, {
      type: "geojson",
      data: EMPTY,
      cluster: true,
      clusterRadius: 22,
      clusterMaxZoom: 15,
      clusterProperties: {
        favCount: asExpr(FAVORITE_CLUSTER_SUM),
        dimSum: ["+", ["coalesce", ["get", "dim"], 0]],
      },
    });
  }
  if (!map.getSource(HOME_AREA_SOURCE)) {
    map.addSource(HOME_AREA_SOURCE, { type: "geojson", data: EMPTY });
  }
  if (!map.getSource(HOME_PREF_SOURCE)) {
    map.addSource(HOME_PREF_SOURCE, { type: "geojson", data: EMPTY });
  }

  if (!map.getLayer("home-dots")) {
    map.addLayer({
    type: "circle",
    source: HOME_DOTS_SOURCE,
    minzoom: 8.5,
    maxzoom: 12,
    paint: {
      "circle-color": SPOT_COLOR,
      "circle-radius": 1,
      "circle-opacity": asExpr(["case", ["==", ["get", "dim"], 1], 0.12, 0.45]),
    } satisfies CirclePaint,
    });
  }

  addPillLayer(
    map,
    "home-pref-minor",
    HOME_PREF_SOURCE,
    "home-pill-minor",
    12,
    false,
    0,
    7,
  );
  addPillLayer(
    map,
    "home-pref-major",
    HOME_PREF_SOURCE,
    "home-pill-major",
    13.5,
    true,
    0,
    7,
  );
  addPillLayer(
    map,
    "home-area-minor",
    HOME_AREA_SOURCE,
    "home-pill-minor",
    12,
    false,
    7,
    12,
  );
  addPillLayer(
    map,
    "home-area-major",
    HOME_AREA_SOURCE,
    "home-pill-major",
    13.5,
    true,
    7,
    12,
  );

  const clusterDim = asExpr([
    "case",
    [
      "all",
      [">", ["get", "dimSum"], 0],
      ["==", ["get", "dimSum"], ["get", "point_count"]],
    ],
    0.35,
    1,
  ]);

  if (!map.getLayer("home-cluster-favorite-ring")) {
    map.addLayer({
      id: "home-cluster-favorite-ring",
      type: "circle",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 12,
      filter: asFilter([
        "all",
        ["has", "point_count"],
        [">", ["get", "favCount"], 0],
      ]),
      paint: {
        "circle-color": "rgba(14, 143, 138, 0.18)",
        "circle-radius": CLUSTER_RING_RADIUS,
        "circle-stroke-width": 2,
        "circle-stroke-color": HOME_FAVORITE_COLOR,
        "circle-opacity": clusterDim,
      } satisfies CirclePaint,
    });
  }
  if (!map.getLayer("home-clusters")) {
    map.addLayer({
      id: "home-clusters",
      type: "circle",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 12,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": SPOT_COLOR,
        "circle-radius": CLUSTER_RADIUS,
        "circle-opacity": clusterDim,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      } satisfies CirclePaint,
    });
  }
  if (!map.getLayer("home-cluster-count")) {
    map.addLayer({
      id: "home-cluster-count",
      type: "symbol",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 12,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 10.5,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }
  if (!map.getLayer("home-point-favorite-ring")) {
    map.addLayer({
      id: "home-point-favorite-ring",
      type: "circle",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 12,
      filter: asFilter(["all", ["!", ["has", "point_count"]], POINT_IS_FAVORITE]),
      paint: {
        "circle-color": "rgba(14, 143, 138, 0.28)",
        "circle-radius": asExpr([
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          6,
          16,
          9,
        ]),
        "circle-stroke-width": 2,
        "circle-stroke-color": HOME_FAVORITE_COLOR,
      } satisfies CirclePaint,
    });
  }
  if (!map.getLayer("home-points")) {
    map.addLayer({
      id: "home-points",
      type: "circle",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 12,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": asExpr([
          "case",
          POINT_IS_FAVORITE,
          HOME_FAVORITE_COLOR,
          ["==", ["get", "dim"], 1],
          "#9aa4ad",
          SPOT_COLOR,
        ]),
        "circle-radius": POINT_RADIUS,
        "circle-opacity": asExpr(["case", ["==", ["get", "dim"], 1], 0.45, 1]),
        "circle-stroke-width": 1.6,
        "circle-stroke-color": "#ffffff",
      } satisfies CirclePaint,
    });
  }
  if (!map.getLayer("home-names")) {
    map.addLayer({
      id: "home-names",
      type: "symbol",
      source: HOME_CLUSTER_SOURCE,
      minzoom: 14.5,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": ["get", "name"],
        "text-font": TEXT_FONT,
        "text-size": 11,
        "text-offset": [0, 0.9],
        "text-anchor": "top",
        "text-optional": true,
        "text-max-width": 10,
      },
      paint: {
        "text-color": "#4a4452",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": asExpr(["case", ["==", ["get", "dim"], 1], 0.35, 1]),
      },
    });
  }
}

export function setHomeGeoJson(
  map: Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
): void {
  const source = map.getSource(sourceId);
  if (source?.type !== "geojson") return;
  (source as GeoJSONSource).setData(data);
}

export function spotCollection(
  spots: readonly NavSpot[],
  animes: NavCatalog["animes"],
  locale: HomeLocale,
  focusId: string | null,
  favorites: ReadonlySet<string>,
): GeoJSON.FeatureCollection {
  const visible = focusId
    ? spots.filter((spot) => spot.subjectId === focusId)
    : spots;
  return {
    type: "FeatureCollection",
    features: visible.map((spot) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [spot.lng, spot.lat],
      },
      properties: {
        id: spot.id,
        name: localizedSpotName(spot, locale),
        anime: animeTitle(animes, spot.subjectId, locale),
        subjectId: spot.subjectId,
        dim: focusId && spot.subjectId !== focusId ? 1 : 0,
        fav: spotFavProperty(spot.subjectId, favorites),
      },
    })),
  };
}

export function labelCollection(
  labels: readonly HomeMapLabel[],
  locale: HomeLocale,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: labels.map((label) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [label.lng, label.lat],
      },
      properties: {
        id: label.id,
        label: homeMapLabelText(label, locale),
        count: label.count,
        major: label.major ? 1 : 0,
        west: label.west,
        south: label.south,
        east: label.east,
        north: label.north,
      },
    })),
  };
}
