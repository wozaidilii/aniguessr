import { describe, expect, it } from "vitest";
import {
  SITEMAP_URL_LIMIT,
  buildLocalizedSitemapEntries,
  buildSitemapIndexXml,
  buildUrlSetXml,
  buildZhTwOnlySitemapEntries,
  chunkSitemapPaths,
  rightsSitemapItem,
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
    expect(xml).not.toContain("zh-tw");
    expect(xml).not.toContain("zh-Hant");
    expect(xml).not.toContain("xmlns:image");
    expect(xml).not.toContain("image:loc");
    expect(xml.endsWith("</urlset>")).toBe(true);
  });

  it("adds zh-Hant and zh-TW only when the path has a Traditional page", () => {
    const covered = buildLocalizedSitemapEntries(
      "https://aniguessr.ayiora.com",
      "/pilgrimage/locations/fujisawa-kanagawa",
      0.7,
      "2026-10-20",
      { zhTw: true },
    );
    expect(covered.map((entry) => entry.loc)).toContain(
      "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/fujisawa-kanagawa",
    );
    expect(covered).toHaveLength(4);
    for (const entry of covered) {
      expect(entry.languages["zh-Hant"]).toBe(
        "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/fujisawa-kanagawa",
      );
      expect(entry.languages["zh-TW"]).toBe(entry.languages["zh-Hant"]);
      expect(entry.languages.zh).toBe(
        "https://aniguessr.ayiora.com/zh/pilgrimage/locations/fujisawa-kanagawa",
      );
    }

    const uncovered = buildLocalizedSitemapEntries(
      "https://aniguessr.ayiora.com",
      "/pilgrimage/locations/shinjuku-tokyo",
      0.7,
      "2026-10-20",
    );
    expect(uncovered).toHaveLength(3);
    expect(JSON.stringify(uncovered)).not.toContain("zh-tw");
    expect(JSON.stringify(uncovered)).not.toContain("zh-Hant");
  });

  it("lists the rights page in every locale, including zh-TW alternates", () => {
    const item = rightsSitemapItem();
    expect(item).toEqual({ path: "/rights", priority: 0.4, zhTw: true });
    const entries = buildLocalizedSitemapEntries(
      "https://aniguessr.ayiora.com",
      item.path,
      item.priority,
      "2026-10-21",
      { zhTw: item.zhTw },
    );
    expect(entries.map((entry) => entry.loc)).toEqual([
      "https://aniguessr.ayiora.com/zh/rights",
      "https://aniguessr.ayiora.com/ja/rights",
      "https://aniguessr.ayiora.com/en/rights",
      "https://aniguessr.ayiora.com/zh-tw/rights",
    ]);
    for (const entry of entries) {
      expect(entry.languages.zh).toBe("https://aniguessr.ayiora.com/zh/rights");
      expect(entry.languages.ja).toBe("https://aniguessr.ayiora.com/ja/rights");
      expect(entry.languages.en).toBe("https://aniguessr.ayiora.com/en/rights");
      expect(entry.languages["zh-Hant"]).toBe(
        "https://aniguessr.ayiora.com/zh-tw/rights",
      );
      expect(entry.languages["zh-TW"]).toBe(entry.languages["zh-Hant"]);
      expect(entry.languages["x-default"]).toBe(
        "https://aniguessr.ayiora.com/en/rights",
      );
    }
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

  it("keeps a zh-TW-only index off the full-hub alternates and under the URL cap", () => {
    const entries = buildZhTwOnlySitemapEntries(
      "https://aniguessr.ayiora.com",
      "/pilgrimage",
      0.5,
      "2026-10-20",
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].loc).toBe(
      "https://aniguessr.ayiora.com/zh-tw/pilgrimage",
    );
    expect(entries[0].languages.zh).toBeUndefined();
    expect(entries[0].languages["zh-TW"]).toBe(entries[0].loc);

    const chunks = chunkSitemapPaths(
      [
        { path: "/a", zhTw: true },
        { path: "/b" },
        { path: "/c", zhTwOnly: true },
      ],
      5,
    );
    expect(chunks).toEqual([
      [{ path: "/a", zhTw: true }],
      [{ path: "/b" }, { path: "/c", zhTwOnly: true }],
    ]);
  });
});
