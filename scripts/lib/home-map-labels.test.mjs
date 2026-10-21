import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PREFECTURES,
  buildHomeMapLabels,
  loadAreaNameOverrides,
  median,
  prefectureKey,
  shortJaAreaName,
} from "./home-map-labels.mjs";

describe("homepage map labels", () => {
  it("shortens Japanese area names", () => {
    expect(shortJaAreaName("東京都渋谷区")).toBe("渋谷区");
    expect(shortJaAreaName("東京都")).toBe("東京都");
    expect(shortJaAreaName("鎌倉市")).toBe("鎌倉");
    expect(shortJaAreaName("横浜市中区")).toBe("横浜・中区");
    expect(shortJaAreaName("南巨摩郡身延町")).toBe("身延町");
    expect(shortJaAreaName("京都市左京区")).toBe("京都・左京区");
    expect(shortJaAreaName("藤沢市")).toBe("藤沢");
    expect(shortJaAreaName("さいたま市大宮区")).toBe("さいたま・大宮区");
    expect(shortJaAreaName("郡山市")).toBe("郡山");
  });

  it("reads a prefecture from a romaji suffix or a JIS code", () => {
    expect(prefectureKey("kamakura-kanagawa")).toBe("kanagawa");
    expect(prefectureKey("26103")).toBe("kyoto");
    expect(prefectureKey("14104")).toBe("kanagawa");
    expect(prefectureKey("japan")).toBe("");
  });

  it("uses the middle value, or the mean of the two central values", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it("places a label on the median and keeps the spot bounds", () => {
    const labels = buildHomeMapLabels({
      spots: [
        { locationSlug: "kamakura-kanagawa", lng: 139.5, lat: 35.3 },
        { locationSlug: "kamakura-kanagawa", lng: 139.7, lat: 35.5 },
        { locationSlug: "fujisawa-kanagawa", lng: 139.48, lat: 35.3 },
      ],
      locations: [
        {
          slug: "kamakura-kanagawa",
          name: { ja: "鎌倉市", zh: "镰仓市", tw: "鎌倉市", en: "Kamakura" },
        },
        {
          slug: "fujisawa-kanagawa",
          name: { ja: "藤沢市", zh: "藤泽市", en: "Fujisawa" },
        },
      ],
      overrides: {
        ja: { "fujisawa-kanagawa": { name: "江の島" } },
      },
    });
    const kamakura = labels.areas.find((area) => area.id === "kamakura-kanagawa");
    expect(kamakura).toMatchObject({
      ja: "鎌倉",
      zh: "镰仓市",
      tw: "鎌倉市",
      en: "Kamakura",
      count: 2,
      lng: 139.6,
      lat: 35.4,
      west: 139.5,
      south: 35.3,
      east: 139.7,
      north: 35.5,
      major: false,
    });
    expect(labels.areas.find((area) => area.id === "fujisawa-kanagawa")?.ja).toBe(
      "江の島",
    );
    expect(labels.prefectures).toEqual([
      expect.objectContaining({
        id: "kanagawa",
        ja: "神奈川",
        zh: "神奈川",
        en: "Kanagawa",
        count: 3,
        major: false,
      }),
    ]);
  });

  const indexPath = path.join(process.cwd(), "public/data/seo/index.json");
  const navPath = path.join(process.cwd(), "public/data/seo/spots-nav.json");

  it.skipIf(!existsSync(indexPath) || !existsSync(navPath))(
    "builds one label per indexed area and one per prefecture",
    () => {
      const index = JSON.parse(readFileSync(indexPath, "utf8"));
      const nav = JSON.parse(readFileSync(navPath, "utf8"));
      const labels = buildHomeMapLabels({
        spots: nav.spots.map((row) => ({
          locationSlug: String(row[2]),
          lat: Number(row[3]),
          lng: Number(row[4]),
        })),
        locations: index.locations.map((location) => ({
          slug: location.slug,
          name: location.name,
        })),
        overrides: loadAreaNameOverrides(),
      });
      expect(labels.areas).toHaveLength(917);
      expect(labels.prefectures).toHaveLength(47);
      expect(labels.prefectures.map((item) => item.id).sort()).toEqual(
        Object.keys(PREFECTURES).sort(),
      );
      expect(
        labels.areas.find((area) => area.id === "fujisawa-kanagawa")?.ja,
      ).toBe("江の島");
      const kanagawa = labels.prefectures.find((item) => item.id === "kanagawa");
      expect(kanagawa?.ja).toBe("神奈川");
      expect(kanagawa?.count).toBeGreaterThan(0);
      expect(labels.areas.some((area) => area.id === "japan")).toBe(true);
      expect(labels.prefectures.some((item) => item.id === "japan")).toBe(false);
    },
  );
});
