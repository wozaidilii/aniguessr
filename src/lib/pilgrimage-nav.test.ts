import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  readFavoriteAnimeIds,
  toggleFavoriteAnimeId,
  writeFavoriteAnimeIds,
} from "~/lib/pilgrimage-favorites";
import {
  ANITABI_SITE,
  CC_BY_NC_SA_4_URL,
  PILGRIMAGE_MAP_STYLE,
  anitabiSourceUrl,
  anitabiUrlFromSpotId,
  filterNavSpots,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  haversineKm,
  localizedNavText,
  parseNavCatalog,
  rankNearbySpots,
  type NavSpot,
} from "~/lib/pilgrimage-nav";

const spot = (
  id: string,
  subjectId: string,
  lat: number,
  lng: number,
): NavSpot => ({
  id,
  subjectId,
  locationSlug: "tokyo",
  lat,
  lng,
  name: { zh: id, ja: id, en: id },
});

describe("pilgrimage navigation", () => {
  it("rebuilds anitabi spot URLs and falls back to the site", () => {
    expect(anitabiUrlFromSpotId("anitabi_51_5c4dgq9pm", "51")).toBe(
      "https://anitabi.cn/map?bangumiId=51&pid=5c4dgq9pm",
    );
    expect(anitabiUrlFromSpotId("other", "51")).toBe(ANITABI_SITE);
    expect(anitabiSourceUrl("https://anitabi.cn/map?bangumiId=1")).toBe(
      "https://anitabi.cn/map?bangumiId=1",
    );
    expect(anitabiSourceUrl("https://example.com/ad")).toBe(ANITABI_SITE);
    expect(CC_BY_NC_SA_4_URL).toBe(
      "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    );
    expect(PILGRIMAGE_MAP_STYLE).not.toMatch(/[?&]key=/);
    expect(
      PILGRIMAGE_MAP_STYLE.startsWith("https://tiles.openfreemap.org/"),
    ).toBe(true);
  });

  it("builds a Google Maps directions link without an API key", () => {
    expect(googleMapsDirectionsUrl(35.1, 139.2)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=35.1,139.2",
    );
  });

  it("builds a Street View panorama link without an API key", () => {
    expect(googleStreetViewUrl(35.2998, 139.4806)).toBe(
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=35.2998,139.4806",
    );
    expect(googleStreetViewUrl(35.2998, 139.4806)).not.toMatch(/[?&]key=/);
    expect(getPilgrimageCopy("ja").streetView).toBe("ストリートビュー");
    expect(getPilgrimageCopy("zh").streetView).toBe("街景");
    expect(getPilgrimageCopy("en").streetView).toBe("Street View");
    expect(getPilgrimageCopy("zh-tw").streetView).toBe("街景服務");
    expect(
      localizedNavText(
        { zh: "片濑", ja: "片瀬", en: "Katase", tw: "片瀨" },
        "zh-tw",
      ),
    ).toBe("片瀨");
  });

  it("keeps the anitabi id embedded in a spot when favorites use the merged work", () => {
    expect(anitabiUrlFromSpotId("anitabi_467930_abc", "240038")).toBe(
      "https://anitabi.cn/map?bangumiId=467930&pid=abc",
    );
  });

  it("parses the compact catalog and filters it", () => {
    const catalog = parseNavCatalog({
      version: 1,
      animes: { "51": ["CL", "クラ", "CLANNAD"] },
      spots: [
        ["anitabi_51_a", "51", "tokyo", 35.6, 139.7, "甲", "ア", "A"],
        ["anitabi_9_b", "9", "kyoto", 35.0, 135.7, "乙", "イ", "B"],
      ],
    });
    expect(catalog.animes["51"]?.ja).toBe("クラ");
    expect(catalog.spots).toHaveLength(2);
    expect(
      filterNavSpots(catalog.spots, {
        favoriteIds: ["51"],
        favoritesOnly: true,
      }).map((item) => item.id),
    ).toEqual(["anitabi_51_a"]);
  });

  it("rejects a catalog that is not version 1", () => {
    expect(() => parseNavCatalog({ version: 2, spots: [] })).toThrow(
      /Invalid navigation catalog/,
    );
  });

  it("ranks favorite spots ahead of closer spots from other anime", () => {
    const spots = [
      spot("near", "other", 35.001, 139),
      spot("far-fav", "fav", 36, 139),
      spot("near-fav", "fav", 35.01, 139),
    ];
    const ranked = rankNearbySpots(spots, { lat: 35, lng: 139 }, ["fav"]);
    expect(ranked.map((item) => item.id)).toEqual([
      "near-fav",
      "far-fav",
      "near",
    ]);
    expect(haversineKm(0, 0, 0, 1)).toBeGreaterThan(110);
    expect(haversineKm(0, 0, 0, 1)).toBeLessThan(112);
  });

  it("stores favorite ids only in the provided storage", () => {
    const saved = new Map<string, string>();
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => {
        saved.set(key, value);
      },
    };
    expect(readFavoriteAnimeIds(storage)).toEqual([]);
    writeFavoriteAnimeIds(["9", "9", 1 as unknown as string], storage);
    expect(readFavoriteAnimeIds(storage)).toEqual(["9"]);
    expect(toggleFavoriteAnimeId("51", ["9"])).toEqual(["9", "51"]);
    expect(toggleFavoriteAnimeId("9", ["9", "51"])).toEqual(["51"]);
  });

  it("service worker does not cache HTML navigations", () => {
    const source = readFileSync("public/sw.js", "utf8");
    expect(source).toContain('request.mode === "navigate"');
    expect(source).toContain("return;");
    expect(source).not.toContain("text/html");
    expect(source).not.toMatch(/cache\.put\(event\.request/);
  });

  it("keeps one default-on anitabi attribution line and no per-locale credit CTA", () => {
    const source = readFileSync(
      "src/components/anitabi-attribution.tsx",
      "utf8",
    );
    const shell = readFileSync(
      "src/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui.tsx",
      "utf8",
    );
    expect(source).toContain("SHOW_ANITABI_ATTRIBUTION = true");
    expect(source).toContain("部分地点数据来自 ");
    expect(source).toContain("，经修改后使用，采用 ");
    expect(source).toContain(" 授权");
    expect(source).toContain("部分地點資料來自 ");
    expect(source).toContain("一部の地点データは ");
    expect(source).toContain("Some location data comes from ");
    expect(source).toContain("text-xs");
    expect(source).toContain("text-[var(--dark-text-secondary)]");
    expect(shell).toContain("<AnitabiAttribution locale={locale}");
    expect(shell).not.toContain("AnitabiCredit");
    for (const locale of ["zh", "ja", "en", "zh-tw"] as const) {
      const copy = getPilgrimageCopy(locale);
      expect(copy.navigate.length).toBeGreaterThan(0);
      expect(copy.formatDistance(0.25)).toMatch(/250/);
      expect(copy).not.toHaveProperty("openAnitabi");
      expect(copy).not.toHaveProperty("creditLead");
    }
  });
});
