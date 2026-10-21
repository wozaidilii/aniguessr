import { describe, expect, it } from "vitest";
import {
  changedPilgrimagePaths,
  indexableLocations,
  lastmodForPath,
  parseSitemapLastmods,
} from "./sitemap-lastmod.mjs";

describe("sitemap lastmod", () => {
  it("keeps the previous date except on routes whose spots changed", () => {
    const previous = parseSitemapLastmods(
      `<url><loc>https://aniguessr.ayiora.com/zh/pilgrimage/locations/chiba-chiba-12106</loc><lastmod>2026-10-21</lastmod></url>` +
        `<url><loc>https://aniguessr.ayiora.com/en/pilgrimage/locations/kyoto-kyoto-26103</loc><lastmod>2026-10-21</lastmod></url>`,
    );
    const changed = new Set(["/pilgrimage/locations/kyoto-kyoto-26103"]);
    expect(
      lastmodForPath("/pilgrimage/locations/chiba-chiba-12106", {
        previous,
        changed,
        changedOn: "2026-10-21",
        fallback: "2026-11-01",
      }),
    ).toBe("2026-10-21");
    expect(
      lastmodForPath("/pilgrimage/locations/kyoto-kyoto-26103", {
        previous,
        changed,
        changedOn: "2026-10-22",
        fallback: "2026-11-01",
      }),
    ).toBe("2026-10-22");
    expect(
      lastmodForPath("/pilgrimage/locations/new-area", {
        previous,
        changed: new Set(),
        changedOn: "2026-10-22",
        fallback: "2026-11-01",
      }),
    ).toBe("2026-11-01");
  });

  it("marks only areas and works whose spot membership changed", () => {
    const previous = [
      ["spot-a", "51", "chiba-chiba-12106"],
      ["spot-b", "51", "kyoto-kyoto-26103"],
    ];
    const next = [
      {
        id: "spot-a",
        subjectId: "51",
        subjectSlug: "51-clannad",
        locationSlug: "chiba-chiba-12106",
      },
      {
        id: "spot-b",
        subjectId: "51",
        subjectSlug: "51-clannad",
        locationSlug: "chiba-chiba-12106",
      },
    ];
    expect(changedPilgrimagePaths(previous, next)).toEqual(
      new Set([
        "/pilgrimage/locations/kyoto-kyoto-26103",
        "/pilgrimage/locations/chiba-chiba-12106",
        "/pilgrimage/anime/51-clannad",
      ]),
    );
    expect(changedPilgrimagePaths(previous, [
      {
        id: "spot-a",
        subjectId: "51",
        subjectSlug: "51-clannad",
        locationSlug: "chiba-chiba-12106",
      },
      {
        id: "spot-b",
        subjectId: "51",
        subjectSlug: "51-clannad",
        locationSlug: "kyoto-kyoto-26103",
      },
    ])).toEqual(new Set());
  });

  it("drops an area with zero spots from the sitemap", () => {
    const locations = indexableLocations([
      { slug: "chiba-chiba-12106", spotCount: 4 },
      { slug: "empty-area", spotCount: 0 },
    ]);
    expect(locations.map((location) => location.slug)).toEqual([
      "chiba-chiba-12106",
    ]);
  });
});
