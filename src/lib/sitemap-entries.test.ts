import { describe, expect, it } from "vitest";
import {
  buildLocalizedSitemapEntries,
  buildSitemapIndexXml,
  SITEMAP_PATHS_PER_FILE,
  SITEMAP_URL_LIMIT,
  sitemapFileCount,
} from "~/lib/sitemap-entries";

describe("sitemap entries", () => {
  it("lists every locale homepage and keeps hreflang alternates", () => {
    const entries = buildLocalizedSitemapEntries(
      "/",
      1,
      new Date("2026-10-19"),
    );
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://aniguessr.ayiora.com/zh",
      "https://aniguessr.ayiora.com/ja",
      "https://aniguessr.ayiora.com/en",
    ]);
    for (const entry of entries) {
      expect(entry.alternates?.languages).toMatchObject({
        zh: "https://aniguessr.ayiora.com/zh",
        ja: "https://aniguessr.ayiora.com/ja",
        en: "https://aniguessr.ayiora.com/en",
        "x-default": "https://aniguessr.ayiora.com/en",
      });
    }
  });

  it("splits files at 2,000 URLs so a response stays under the 4.5 MB limit", () => {
    expect(SITEMAP_URL_LIMIT).toBe(2_000);
    expect(SITEMAP_PATHS_PER_FILE * 3).toBeLessThanOrEqual(SITEMAP_URL_LIMIT);
    expect(SITEMAP_PATHS_PER_FILE * 3).toBeGreaterThan(1_500);
    expect(sitemapFileCount(1)).toBe(1);
    expect(sitemapFileCount(SITEMAP_PATHS_PER_FILE + 1)).toBe(2);
  });

  it("builds a sitemap index that points at the split files", () => {
    const xml = buildSitemapIndexXml([
      "https://aniguessr.ayiora.com/sitemap/0.xml",
      "https://aniguessr.ayiora.com/sitemap/1.xml",
    ]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(
      "<loc>https://aniguessr.ayiora.com/sitemap/0.xml</loc>",
    );
    expect(xml).toContain(
      "<loc>https://aniguessr.ayiora.com/sitemap/1.xml</loc>",
    );
  });
});
