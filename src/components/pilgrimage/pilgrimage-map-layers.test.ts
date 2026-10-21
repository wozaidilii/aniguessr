import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { filterNavSpots, type NavSpot } from "~/lib/pilgrimage-nav";
import {
  CLUSTER_HAS_FAVORITE,
  DEFAULT_FAVORITES_ONLY,
  FAVORITE_CLUSTER_SUM,
  FAVORITE_COLOR,
  SPOT_CLUSTER,
  SPOT_COLOR,
  spotClusterFavoriteRing,
  spotFavProperty,
  spotFavoriteRing,
  spotPointPaint,
} from "./pilgrimage-map-layers";

const mapSource = readFileSync(
  path.join(process.cwd(), "src/components/pilgrimage/pilgrimage-map.tsx"),
  "utf8",
);

function spot(id: string, subjectId: string): NavSpot {
  return {
    id,
    subjectId,
    locationSlug: "tokyo",
    lat: 35.6,
    lng: 139.7,
    name: { zh: id, ja: id, en: id },
  };
}

describe("pilgrimage map favorites", () => {
  it("starts with every work visible and keeps the favorites toggle as an opt-in", () => {
    expect(DEFAULT_FAVORITES_ONLY).toBe(false);
    expect(mapSource).toContain("useState(DEFAULT_FAVORITES_ONLY)");
    expect(mapSource).toContain("setFavoritesOnly(true)");
    expect(mapSource).toContain("copy.mapShowFavorites");
    expect(mapSource).not.toContain(
      "if (!subjectId && favorites.ids.length > 0) setFavoritesOnly(true)",
    );
    expect(mapSource).not.toContain("defaulted");

    const spots = [spot("fav", "51"), spot("other", "9")];
    expect(
      filterNavSpots(spots, {
        favoriteIds: ["51"],
        favoritesOnly: DEFAULT_FAVORITES_ONLY,
      }).map((item) => item.id),
    ).toEqual(["fav", "other"]);
  });

  it("marks favorite points and any cluster that contains one", () => {
    const favorites = new Set(["51"]);
    expect(spotFavProperty("51", favorites)).toBe(1);
    expect(spotFavProperty("9", favorites)).toBe(0);

    const clusterProperties = SPOT_CLUSTER.clusterProperties as {
      favCount: unknown;
    };
    expect(clusterProperties.favCount).toEqual(FAVORITE_CLUSTER_SUM);
    expect(FAVORITE_CLUSTER_SUM).toEqual([
      "+",
      ["case", ["has", "point_count"], ["get", "favCount"], ["get", "fav"]],
    ]);

    const point = spotPointPaint();
    expect(point["circle-color"]).toEqual([
      "case",
      ["==", ["get", "fav"], 1],
      FAVORITE_COLOR,
      SPOT_COLOR,
    ]);
    expect(point["circle-radius"]).toEqual([
      "case",
      ["==", ["get", "fav"], 1],
      7,
      6,
    ]);

    const ring = spotFavoriteRing();
    expect(ring.filter).toEqual([
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "fav"], 1],
    ]);
    expect(ring.paint["circle-stroke-color"]).toBe(FAVORITE_COLOR);

    const clusterRing = spotClusterFavoriteRing();
    expect(clusterRing.filter).toEqual([
      "all",
      ["has", "point_count"],
      CLUSTER_HAS_FAVORITE,
    ]);
    expect(clusterRing.paint["circle-stroke-color"]).toBe(FAVORITE_COLOR);
    expect(mapSource).toContain("spotClusterFavoriteRing");
    expect(mapSource).toContain("spotFavoriteRing");
  });
});
