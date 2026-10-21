import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
} from "maplibre-gl";

/**
 * Pilgrimage map drawing. Favorites-only starts off; the toggle is the opt-in.
 * Favorite works keep a cyan point and ring, and a cluster that contains one
 * gets the same ring. `fav` is 1 or 0 on each point. Nested clusters sum it
 * into `favCount`.
 */

type CirclePaint = NonNullable<CircleLayerSpecification["paint"]>;

function asExpr(value: readonly unknown[]): ExpressionSpecification {
  return value as unknown as ExpressionSpecification;
}

function asFilter(value: readonly unknown[]): FilterSpecification {
  return value as unknown as FilterSpecification;
}

export const DEFAULT_FAVORITES_ONLY = false;

export const FAVORITE_COLOR = "#67e8f9";
export const SPOT_COLOR = "#fb7185";
export const CLUSTER_COLOR = "#f472b6";

/** Sum `fav` through points and through clusters already aggregated. */
export const FAVORITE_CLUSTER_SUM = [
  "+",
  ["case", ["has", "point_count"], ["get", "favCount"], ["get", "fav"]],
] as const;

export const CLUSTER_HAS_FAVORITE = [">", ["get", "favCount"], 0] as const;

export const POINT_IS_FAVORITE = ["==", ["get", "fav"], 1] as const;

export const SPOT_CLUSTER: Pick<
  GeoJSONSourceSpecification,
  "cluster" | "clusterRadius" | "clusterMaxZoom" | "clusterProperties"
> = {
  cluster: true,
  clusterRadius: 48,
  clusterMaxZoom: 14,
  clusterProperties: {
    favCount: asExpr(FAVORITE_CLUSTER_SUM),
  },
};

const CLUSTER_RADIUS = asExpr([
  "step",
  ["get", "point_count"],
  16,
  25,
  22,
  100,
  28,
]);

const CLUSTER_RING_RADIUS = asExpr([
  "step",
  ["get", "point_count"],
  21,
  25,
  27,
  100,
  34,
]);

export function spotClusterPaint(): CirclePaint {
  return {
    "circle-color": CLUSTER_COLOR,
    "circle-radius": CLUSTER_RADIUS,
    "circle-stroke-width": 1,
    "circle-stroke-color": "#fff7fb",
  };
}

/** Drawn under the cluster bubble so a favorite inside still shows a ring. */
export function spotClusterFavoriteRing() {
  return {
    id: "spot-cluster-favorite-ring",
    filter: asFilter(["all", ["has", "point_count"], CLUSTER_HAS_FAVORITE]),
    paint: {
      "circle-color": "rgba(103, 232, 249, 0.18)",
      "circle-radius": CLUSTER_RING_RADIUS,
      "circle-stroke-width": 2,
      "circle-stroke-color": FAVORITE_COLOR,
    } satisfies CirclePaint,
  };
}

export function spotPointPaint(): CirclePaint {
  return {
    "circle-color": asExpr(["case", POINT_IS_FAVORITE, FAVORITE_COLOR, SPOT_COLOR]),
    "circle-radius": asExpr(["case", POINT_IS_FAVORITE, 7, 6]),
    "circle-stroke-width": asExpr(["case", POINT_IS_FAVORITE, 2.5, 1.5]),
    "circle-stroke-color": asExpr([
      "case",
      POINT_IS_FAVORITE,
      "#ecfeff",
      "#fff7fb",
    ]),
  };
}

/** Halo behind an unclustered favorite point. */
export function spotFavoriteRing() {
  return {
    id: "spot-favorite-ring",
    filter: asFilter([
      "all",
      ["!", ["has", "point_count"]],
      POINT_IS_FAVORITE,
    ]),
    paint: {
      "circle-color": "rgba(103, 232, 249, 0.28)",
      "circle-radius": 12,
      "circle-stroke-width": 2,
      "circle-stroke-color": FAVORITE_COLOR,
    } satisfies CirclePaint,
  };
}

export function spotFavProperty(
  subjectId: string,
  favorites: ReadonlySet<string>,
): 0 | 1 {
  return favorites.has(subjectId) ? 1 : 0;
}
