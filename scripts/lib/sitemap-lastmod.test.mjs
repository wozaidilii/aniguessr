import { describe, expect, it } from "vitest";
import {
  lastmodForPath,
  parseSitemapLastmods,
  pathsForRenamedSpots,
} from "./sitemap-lastmod.mjs";

describe("sitemap lastmod", () => {
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
