import { describe, expect, it } from "vitest";
import { buildHomeCatalog, type HomeCatalogSource } from "~/lib/home-catalog";

function source(): HomeCatalogSource {
  return {
    spotCount: 4,
    animeCount: 2,
    locationCount: 3,
    locations: [
      {
        slug: "kamakura-kanagawa",
        name: { zh: "镰仓", ja: "鎌倉", en: "Kamakura", tw: "鎌倉" },
        spotCount: 2,
      },
      {
        slug: "fujisawa-kanagawa",
        name: { zh: "藤泽", ja: "藤沢", en: "Fujisawa", tw: "藤澤" },
        spotCount: 1,
      },
      {
        slug: "tokyo",
        name: { zh: "东京", ja: "東京", en: "Tokyo" },
        spotCount: 9,
      },
    ],
    animes: [
      {
        subjectId: "1",
        slug: "one-title",
        animeTitle: { zh: "作品一", ja: "作品一", en: "Work One", tw: "作品一" },
        spotCount: 3,
      },
      {
        subjectId: "2",
        slug: "two-title",
        animeTitle: { zh: "作品二", ja: "作品二", en: "Work Two" },
        spotCount: 1,
      },
    ],
    spots: [
      {
        id: "spot-a",
        subjectId: "1",
        locationSlug: "kamakura-kanagawa",
        lat: 35.32,
        lng: 139.55,
        answerName: { zh: "坡道", ja: "坂", en: "Slope", tw: "坡道" },
        animeTitle: { zh: "作品一", ja: "作品一", en: "Work One", tw: "作品一" },
      },
      {
        id: "spot-b",
        subjectId: "1",
        locationSlug: "kamakura-kanagawa",
        lat: 35.33,
        lng: 139.56,
        answerName: { zh: "车站", ja: "駅", en: "Station", tw: "車站" },
        animeTitle: { zh: "作品一", ja: "作品一", en: "Work One", tw: "作品一" },
      },
      {
        id: "spot-c",
        subjectId: "2",
        locationSlug: "fujisawa-kanagawa",
        lat: 35.34,
        lng: 139.48,
        answerName: { zh: "海岸", ja: "海岸", en: "Coast", tw: "海岸" },
        animeTitle: { zh: "作品二", ja: "作品二", en: "Work Two" },
      },
      {
        id: "spot-d",
        subjectId: "1",
        locationSlug: "tokyo",
        lat: 35.68,
        lng: 139.76,
        answerName: { zh: "塔", ja: "塔", en: "Tower" },
        animeTitle: { zh: "作品一", ja: "作品一", en: "Work One", tw: "作品一" },
      },
    ],
  };
}

describe("homepage catalog", () => {
  it("ranks real spot counts and links each locale to its own pages", () => {
    const catalog = buildHomeCatalog(source(), "ja");
    expect(catalog.spotCount).toBe(4);
    expect(catalog.areas.map((area) => area.slug)).toEqual([
      "tokyo",
      "kamakura-kanagawa",
      "fujisawa-kanagawa",
    ]);
    expect(catalog.areas[0]?.href).toBe("/ja/pilgrimage/locations/tokyo");
    expect(catalog.animeCards[0]?.href).toBe("/ja/pilgrimage/anime/one-title");
    expect(catalog.nearby.map((spot) => spot.href)).toEqual([
      "/ja/pilgrimage/spots/spot-d",
    ]);
    expect(catalog.spotCount).not.toBe(23834);
  });

  it("keeps zh-TW links inside the covered locations and off simplified names", () => {
    const catalog = buildHomeCatalog(source(), "zh-tw");
    expect(catalog.areas.map((area) => area.slug)).toEqual([
      "kamakura-kanagawa",
      "fujisawa-kanagawa",
    ]);
    expect(catalog.areas.map((area) => area.name)).toEqual(["鎌倉", "藤澤"]);
    expect(catalog.areas.every((area) => area.href.startsWith("/zh-tw/"))).toBe(
      true,
    );
    expect(catalog.spotCount).toBe(3);
    expect(catalog.animeCards.map((card) => card.slug)).toEqual([
      "one-title",
      "two-title",
    ]);
    expect(catalog.animeTags).toEqual([]);
    expect(catalog.nearby.map((spot) => spot.name)).toEqual(["坡道", "車站"]);
  });
});
