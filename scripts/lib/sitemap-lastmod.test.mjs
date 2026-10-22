import { describe, expect, it } from "vitest";
import {
  changedPilgrimagePaths,
  indexableLocations,
  lastmodForPath,
  parseSitemapLastmods,
  pathsForRenamedSpots,
  contentChangedSitemapPaths,
  renamedSpotPaths,
  SITEMAP_CONTENT_LASTMOD,
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

  it("keeps the previous date except on routes whose names changed", () => {
    const previous = parseSitemapLastmods(
      `<url><loc>https://aniguessr.ayiora.com/ja/pilgrimage/spots/anitabi_37137_4slhba842</loc><lastmod>2026-10-21</lastmod></url>` +
        `<url><loc>https://aniguessr.ayiora.com/zh/pilgrimage/locations/kamakura-kanagawa</loc><lastmod>2026-10-21</lastmod></url>`,
    );
    const changed = new Set([
      "/pilgrimage/spots/anitabi_37137_4slhba842",
      "/pilgrimage/locations/fujisawa-kanagawa",
    ]);
    expect(
      lastmodForPath("/pilgrimage/locations/kamakura-kanagawa", {
        previous,
        changed,
        changedOn: "2026-10-22",
        fallback: "2026-11-01",
      }),
    ).toBe("2026-10-21");
    expect(
      lastmodForPath("/pilgrimage/locations/fujisawa-kanagawa", {
        previous,
        changed,
        changedOn: "2026-10-22",
        fallback: "2026-11-01",
      }),
    ).toBe("2026-10-22");
    expect(
      lastmodForPath("/pilgrimage/spots/new", {
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
    expect(
      changedPilgrimagePaths(previous, [
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
      ]),
    ).toEqual(new Set());
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

  it("adds recorded membership paths and does not infer area pages", () => {
    const spots = [
      {
        id: "anitabi_37137_4slhba842",
        locationSlug: "fujisawa-kanagawa",
        subjectSlug: "37137-tari-tari",
      },
    ];
    expect(
      contentChangedSitemapPaths(["anitabi_37137_4slhba842"], spots, []),
    ).toEqual(new Set(["/pilgrimage/spots/anitabi_37137_4slhba842"]));
    expect(
      contentChangedSitemapPaths(
        ["anitabi_37137_4slhba842"],
        spots,
        ["/pilgrimage/locations/chiba-chiba-12106"],
      ),
    ).toEqual(
      new Set([
        "/pilgrimage/spots/anitabi_37137_4slhba842",
        "/pilgrimage/locations/chiba-chiba-12106",
      ]),
    );
  });

  it("bumps renamed spot pages only, on the fixed content date", () => {
    const spots = [
      {
        id: "anitabi_37137_4slhba842",
        locationSlug: "fujisawa-kanagawa",
        subjectSlug: "37137-tari-tari",
      },
      {
        id: "untouched",
        locationSlug: "kamakura-kanagawa",
        subjectSlug: "51-clannad",
      },
    ];
    const changed = renamedSpotPaths(["anitabi_37137_4slhba842"], spots);
    expect(changed).toEqual(
      new Set(["/pilgrimage/spots/anitabi_37137_4slhba842"]),
    );
    expect(SITEMAP_CONTENT_LASTMOD).toBe("2026-10-23");
    expect(
      lastmodForPath("/pilgrimage/spots/anitabi_37137_4slhba842", {
        previous: new Map([
          ["/pilgrimage/spots/anitabi_37137_4slhba842", "2026-10-21"],
          ["/pilgrimage/locations/fujisawa-kanagawa", "2026-10-21"],
        ]),
        changed,
        changedOn: SITEMAP_CONTENT_LASTMOD,
        fallback: "2026-10-21",
      }),
    ).toBe("2026-10-23");
    expect(
      lastmodForPath("/pilgrimage/locations/fujisawa-kanagawa", {
        previous: new Map([
          ["/pilgrimage/locations/fujisawa-kanagawa", "2026-10-21"],
        ]),
        changed,
        changedOn: SITEMAP_CONTENT_LASTMOD,
        fallback: "2026-10-21",
      }),
    ).toBe("2026-10-21");
  });

  it("marks the spot, its area page, and its work page", () => {
    const changed = pathsForRenamedSpots(
      ["cafe"],
      [
        {
          id: "cafe",
          locationSlug: "fujisawa-kanagawa",
          subjectSlug: "37137-tari-tari",
        },
        {
          id: "other",
          locationSlug: "kamakura-kanagawa",
          subjectSlug: "51-clannad",
        },
        {
          id: "hidden",
          redirectTo: "cafe",
          locationSlug: "fujisawa-kanagawa",
          subjectSlug: "37137-tari-tari",
        },
      ],
    );
    expect(changed).toEqual(
      new Set([
        "/pilgrimage/spots/cafe",
        "/pilgrimage/locations/fujisawa-kanagawa",
        "/pilgrimage/anime/37137-tari-tari",
      ]),
    );
  });
});
