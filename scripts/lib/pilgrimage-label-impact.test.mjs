import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities, locateMunicipality } from "./japan-area.mjs";
import { pilgrimagePageMetadata } from "../../src/lib/seo.ts";
import { pathsForRenamedSpots, affiliatePilotSitemapPaths } from "./sitemap-lastmod.mjs";
import knownSlugs from "../../src/lib/pilgrimage-known-slugs.json" with { type: "json" };

loadMunicipalities(
  path.join(process.cwd(), "scripts/data/japan-municipalities.json"),
);

const nav = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "public/data/seo/spots-nav.json"),
    "utf8",
  ),
);

const seoIndex = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "public/data/seo/index.json"),
    "utf8",
  ),
);
const subjectSlugById = new Map(
  (seoIndex.animes ?? []).map((anime) => [String(anime.subjectId), anime.slug]),
);

function areaSlug(lng, lat) {
  return locateMunicipality(lng, lat)?.slug ?? "japan";
}

describe("rewritten question labels and pilgrimage pages", () => {
  it("does not move spots between area pages", () => {
    const moves = new Map();
    const before = new Map();
    const after = new Map();
    for (const row of nav.spots) {
      const published = row[2];
      const next = areaSlug(row[4], row[3]);
      before.set(published, (before.get(published) ?? 0) + 1);
      after.set(next, (after.get(next) ?? 0) + 1);
      if (published === next) continue;
      const key = `${published} -> ${next}`;
      moves.set(key, (moves.get(key) ?? 0) + 1);
    }
    const top = [...moves.entries()].sort((left, right) => right[1] - left[1]);
    const emptied = [...before.keys()].filter((slug) => (after.get(slug) ?? 0) === 0);
    expect(top.slice(0, 20)).toEqual([]);
    expect(emptied).toEqual([]);
    expect(before.size).toBe(917);
    expect(after.size).toBe(917);
  });

  it("keeps Makuhari on the Chiba area page while the question label is 千叶市", () => {
    const row = nav.spots.find((spot) => spot[0] === "anitabi_102134_9xs0myq");
    expect(row[2]).toBe("chiba-chiba-12106");
    expect(areaSlug(row[4], row[3])).toBe("chiba-chiba-12106");
    const questions = readFileSync(
      path.join(process.cwd(), "public/data/anime-guessr-questions.json"),
      "utf8",
    );
    const at = questions.indexOf('"id": "anitabi_102134_9xs0myq"');
    const block = questions.slice(at, questions.indexOf('"id": "', at + 10));
    expect(block).toContain('"location": "千叶市"');
    expect(block).not.toContain('"locationSlug"');
  });

  it("bumps lastmod only on renamed spot pages and keeps every area URL", () => {
    const fixes = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "scripts/data/spot-name-suffix-fixes.json"),
        "utf8",
      ),
    );
    const step1 = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "scripts/data/intl-seo-step1-sitemap.json"),
        "utf8",
      ),
    );
    const step1Paths = new Set(
      (step1.locationMetaSlugs ?? []).map(
        (slug) => `/pilgrimage/locations/${slug}`,
      ),
    );
    const zhTwPlaceIds = new Set(
      Object.keys(
        JSON.parse(
          readFileSync(
            path.join(
              process.cwd(),
              "scripts/data/zh-tw-spot-place-overrides.json",
            ),
            "utf8",
          ),
        ),
      ),
    );
    const navSpots = nav.spots.map((row) => ({
      id: String(row[0]),
      locationSlug: String(row[2]),
      subjectSlug: subjectSlugById.get(String(row[1])),
      redirectTo: null,
    }));
    const bumpedPaths = new Set(step1Paths);
    for (const route of pathsForRenamedSpots([...zhTwPlaceIds], navSpots)) {
      bumpedPaths.add(route);
    }
    let affiliatePilotPaths = new Set();
    try {
      const allowlist = JSON.parse(
        readFileSync(
          path.join(process.cwd(), "data/affiliate-allowlist.json"),
          "utf8",
        ),
      );
      affiliatePilotPaths = affiliatePilotSitemapPaths(allowlist);
    } catch {
      affiliatePilotPaths = new Set();
    }
    const renamed = new Set(
      (fixes.names?.fixes ?? []).map((row) => String(row.id)),
    );
    let copyIds = new Set();
    try {
      const edits = JSON.parse(
        readFileSync(
          path.join(process.cwd(), "scripts/data/spot-copy-edits.json"),
          "utf8",
        ),
      );
      copyIds = new Set((edits.ids ?? []).map((id) => String(id)));
    } catch {
      copyIds = new Set();
    }
    const files = readdirSync(path.join(process.cwd(), "public/sitemaps")).filter(
      (file) => /^\d+\.xml$/u.test(file),
    );
    const paths = new Set();
    const bumped = new Set();
    for (const file of files) {
      const xml = readFileSync(
        path.join(process.cwd(), "public/sitemaps", file),
        "utf8",
      );
      for (const match of xml.matchAll(
        /<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/gu,
      )) {
        const loc = match[1];
        const lastmod = match[2];
        const pathname = decodeURIComponent(
          new URL(loc).pathname.replace(/^\/(?:zh-tw|zh|ja|en)(?=\/|$)/u, "") ||
            "/",
        );
        paths.add(pathname);
        const spotId = pathname.startsWith("/pilgrimage/spots/")
          ? decodeURIComponent(pathname.slice("/pilgrimage/spots/".length))
          : "";
        if (affiliatePilotPaths.has(pathname)) {
          expect(lastmod).toBe("2026-10-29");
        } else if (renamed.has(spotId) || copyIds.has(spotId)) {
          expect(lastmod).toBe("2026-10-23");
          bumped.add(spotId);
        } else if (bumpedPaths.has(pathname)) {
          expect(lastmod).toBe("2026-10-29");
        } else {
          expect(lastmod).toBe("2026-10-21");
        }
      }
    }
    expect(bumped.size).toBeGreaterThan(0);
    for (const slug of knownSlugs.location) {
      expect(paths.has(`/pilgrimage/locations/${slug}`)).toBe(true);
    }
    expect(paths.has("/pilgrimage/locations/chiba-chiba-12106")).toBe(true);
    expect(paths.has("/")).toBe(true);
  });

  it("keeps ISR, canonical, and hreflang on area pages", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/[locale]/pilgrimage/locations/[slug]/page.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("export const revalidate = 86_400");
    expect(source).toContain("refuseEmptyArea");
    const metadata = pilgrimagePageMetadata(
      "zh",
      "/pilgrimage/locations/chiba-chiba-12106",
      "千叶",
      "spots",
      true,
    );
    expect(metadata.alternates?.canonical).toBe(
      "/zh/pilgrimage/locations/chiba-chiba-12106",
    );
    expect(metadata.alternates?.languages).toMatchObject({
      "zh-Hans":
        "https://aniguessr.ayiora.com/zh/pilgrimage/locations/chiba-chiba-12106",
      "zh-CN":
        "https://aniguessr.ayiora.com/zh/pilgrimage/locations/chiba-chiba-12106",
      ja: "https://aniguessr.ayiora.com/ja/pilgrimage/locations/chiba-chiba-12106",
      en: "https://aniguessr.ayiora.com/en/pilgrimage/locations/chiba-chiba-12106",
      "x-default":
        "https://aniguessr.ayiora.com/en/pilgrimage/locations/chiba-chiba-12106",
      "zh-Hant":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
      "zh-TW":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
      "zh-HK":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
      "zh-MO":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
    });
  });
});
