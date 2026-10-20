import { describe, expect, it } from "vitest";
import {
  SITEMAP_URL_LIMIT,
  buildLocalizedSitemapEntries,
  buildSitemapIndexXml,
  buildUrlSetXml,
} from "./sitemap-xml.mjs";

describe("static sitemap XML", () => {
  it("emits a urlset with hreflang alternates under the size cap", () => {
    const xml = buildUrlSetXml(
      buildLocalizedSitemapEntries(
        "https://aniguessr.ayiora.com",
        "/pilgrimage",
        0.9,
        "2026-10-20",
      ),
    );
    expect(SITEMAP_URL_LIMIT).toBe(2_000);
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain("<urlset");
    expect(xml).toContain('hreflang="ja"');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml.endsWith("</urlset>")).toBe(true);
  });

  it("builds an index that points at public sitemap paths", () => {
    const xml = buildSitemapIndexXml([
      "https://aniguessr.ayiora.com/sitemap/0.xml",
    ]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(
      "<loc>https://aniguessr.ayiora.com/sitemap/0.xml</loc>",
    );
    expect(xml.endsWith("</sitemapindex>")).toBe(true);
  });
});
