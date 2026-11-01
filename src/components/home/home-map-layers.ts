import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map,
} from "maplibre-gl";
import {
  FAVORITE_CLUSTER_SUM,
  POINT_IS_FAVORITE,
  spotFavProperty,
} from "~/components/pilgrimage/pilgrimage-map-layers";
import type { HomeLocale } from "~/lib/home-locale";
import type { NavCatalog, NavSpot } from "~/lib/pilgrimage-nav";
import { animeTitle, localizedSpotName } from "~/lib/pilgrimage-nav";

export const HOME_DOTS_SOURCE = "home-dots";
export const HOME_CLUSTER_SOURCE = "home-spots";

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

  if (!map.getLayer("home-dots")) {
    map.addLayer({
      id: "home-dots",
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
