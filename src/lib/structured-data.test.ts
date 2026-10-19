import { describe, expect, it } from "vitest";
import { BRAND_NAME } from "~/lib/site-url";
import {
  buildHomeStructuredData,
  buildPlaceCollectionJsonLd,
  buildTouristAttractionJsonLd,
  validateJsonLd,
} from "~/lib/structured-data";

const spot = {
  name: "CLANNAD Slope",
  description: "A slope near Lake Tama.",
  url: "https://aniguessr.ayiora.com/en/pilgrimage/spots/example",
  image: "https://cdn.example.com/clannad.jpg",
  latitude: 35.764,
  longitude: 139.428,
  area: "Tokyo",
  anime: "CLANNAD",
  episode: "Season 1 opening, 198 seconds",
};

describe("structured data", () => {
  it("describes the homepage as Ayiora's free browser game", () => {
    const data = buildHomeStructuredData("en");
    expect(validateJsonLd(data)).toEqual([]);
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    const organization = graph.find((node) => node["@type"] === "Organization");
    const website = graph.find((node) => node["@type"] === "WebSite");
    const game = graph.find((node) =>
      Array.isArray(node["@type"])
        ? node["@type"].includes("VideoGame")
        : node["@type"] === "VideoGame",
    );
    expect(organization).toMatchObject({
      name: "Ayiora",
      url: "https://ayiora.com",
    });
    expect(website).toMatchObject({
      name: BRAND_NAME,
      url: "https://aniguessr.ayiora.com/en",
    });
    expect(game).toMatchObject({
      name: BRAND_NAME,
      isAccessibleForFree: true,
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  });

  it("describes a filming location as a TouristAttraction", () => {
    const data = buildTouristAttractionJsonLd(spot);
    expect(validateJsonLd(data)).toEqual([]);
    expect(data).toMatchObject({
      "@type": "TouristAttraction",
      name: "CLANNAD Slope",
      geo: { latitude: 35.764, longitude: 139.428 },
      containedInPlace: { "@type": "Place", name: "Tokyo" },
      subjectOf: {
        "@type": "TVEpisode",
        name: spot.episode,
        partOfSeries: { "@type": "TVSeries", name: "CLANNAD" },
      },
    });
  });

  it("rejects a filming location that is missing coordinates", () => {
    const invalid = buildTouristAttractionJsonLd({
      ...spot,
      latitude: Number.NaN,
    });
    expect(validateJsonLd(invalid).length).toBeGreaterThan(0);
  });

  it("nests filming locations under a Place", () => {
    const data = buildPlaceCollectionJsonLd({
      name: "Tokyo",
      description: "Anime filming locations in Tokyo.",
      url: "https://aniguessr.ayiora.com/en/pilgrimage/locations/tokyo",
      latitude: 35.764,
      longitude: 139.428,
      places: [spot],
    });
    expect(validateJsonLd(data)).toEqual([]);
  });
});
