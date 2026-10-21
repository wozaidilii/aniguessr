import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities, locateMunicipality } from "./japan-area.mjs";
import { pilgrimagePageMetadata } from "../../src/lib/seo.ts";
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

  it("keeps every published area URL in the sitemap with the existing lastmod", () => {
    const files = readdirSync(path.join(process.cwd(), "public/sitemaps")).filter(
      (file) => /^\d+\.xml$/u.test(file),
    );
    const paths = new Set();
    const lastmods = new Set();
    for (const file of files) {
      const xml = readFileSync(
        path.join(process.cwd(), "public/sitemaps", file),
        "utf8",
      );
      for (const match of xml.matchAll(
        /<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/gu,
      )) {
        lastmods.add(match[2]);
        const pathname = new URL(match[1]).pathname.replace(
          /^\/(?:zh-tw|zh|ja|en)(?=\/|$)/u,
          "",
        );
        paths.add(pathname || "/");
      }
    }
    expect([...lastmods]).toEqual(["2026-10-21"]);
    for (const slug of knownSlugs.location) {
      expect(paths.has(`/pilgrimage/locations/${slug}`)).toBe(true);
    }
    expect(paths.has("/pilgrimage/locations/chiba-chiba-12106")).toBe(true);
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
      zh: "https://aniguessr.ayiora.com/zh/pilgrimage/locations/chiba-chiba-12106",
      ja: "https://aniguessr.ayiora.com/ja/pilgrimage/locations/chiba-chiba-12106",
      en: "https://aniguessr.ayiora.com/en/pilgrimage/locations/chiba-chiba-12106",
      "x-default":
        "https://aniguessr.ayiora.com/en/pilgrimage/locations/chiba-chiba-12106",
      "zh-Hant":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
      "zh-TW":
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/chiba-chiba-12106",
    });
  });
});
