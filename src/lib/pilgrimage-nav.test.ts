import { readFileSync } from "node:fs";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { describe, expect, it } from "vitest";
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
  clusterSamePlaces,
  filterNavSpots,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  haversineKm,
  localizedNavText,
  dedupedWorkTitles,
  formatPlaceWorkSubtitle,
  formatWorkTitle,
  groupPlaceWorks,
  parseNavCatalog,
  placeNamesSimilar,
  rankNearbySpots,
  type NavSpot,
  type NavText,
} from "~/lib/pilgrimage-nav";

const spot = (
  id: string,
  subjectId: string,
  lat: number,
  lng: number,
  name?: Partial<NavText>,
): NavSpot => ({
  id,
  subjectId,
  locationSlug: "tokyo",
  lat,
  lng,
  name: { zh: id, ja: id, en: id, ...name },
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
    expect(PILGRIMAGE_MAP_STYLE).toBe(
      "https://tiles.openfreemap.org/styles/positron",
    );
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
    expect(
      localizedNavText(
        { zh: "稲村ヶ崎", ja: "", en: "Inamuragasaki", tw: "稲村ヶ崎" },
        "ja",
      ),
    ).toBe("稲村ヶ崎");
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

  it("groups the same place and keeps each spot id", () => {
    const nakatsu = spot(
      "anitabi_215158_51i53xo8n",
      "215158",
      35.2994,
      139.4802,
      {
        ja: "中津宮（江の島）",
        zh: "中津宫",
      },
    );
    const shrine = spot(
      "anitabi_321885_csisxbghx",
      "321885",
      35.2993,
      139.4802,
      {
        ja: "江島神社中津宮",
        zh: "江岛神社中津宫",
      },
    );
    const other = spot("stairs-far", "1", 35.302, 139.4802, {
      ja: "中津宮（江の島）",
    });
    const unrelated = spot("hachi", "2", 35.2994, 139.4802, {
      ja: "ハチ公",
      zh: "八公",
    });
    const groups = clusterSamePlaces([nakatsu, shrine, unrelated, other]);
    const paired = groups.find((group) => group.length > 1);
    expect(paired?.map((item) => item.id)).toEqual([
      "anitabi_215158_51i53xo8n",
      "anitabi_321885_csisxbghx",
    ]);
    expect(groups.map((group) => group[0]?.id)).toEqual([
      "anitabi_215158_51i53xo8n",
      "hachi",
      "stairs-far",
    ]);
    expect(placeNamesSimilar(nakatsu.name, shrine.name)).toBe(true);
    expect(formatWorkTitle("ja", "『Just Because!』")).toBe(
      "『Just Because!』",
    );
    expect(formatWorkTitle("ja", "刀使ノ巫女")).toBe("『刀使ノ巫女』");
    expect(formatWorkTitle("zh", "『Just Because!』")).toBe(
      "《Just Because!》",
    );
    expect(formatWorkTitle("zh-tw", "Just Because!")).toBe("《Just Because!》");
    expect(formatWorkTitle("en", "『Just Because!』")).toBe('"Just Because!"');
    const stairs = spot("stairs", "215158", 35.2994, 139.4804, {
      ja: "中津宮階段",
    });
    const grouped = groupPlaceWorks(
      [nakatsu, stairs, shrine],
      {
        "215158": { zh: "刀使", ja: "刀使ノ巫女", en: "Toji" },
        "321885": { zh: "电锯人", ja: "チェンソーマン", en: "Chainsaw Man" },
      },
      "ja",
      (id) => `/ja/pilgrimage/spots/${id}`,
    );
    expect(grouped.map((work) => work.title)).toEqual([
      "『刀使ノ巫女』",
      "『チェンソーマン』",
    ]);
    expect(grouped[0]?.countLabel).toBe("（2か所）");
    expect(grouped[0]?.spots.map((item) => item.place)).toEqual([
      "中津宮（江の島）",
      "中津宮階段",
    ]);
    expect(grouped[0]?.spots.map((item) => item.href)).toEqual([
      "/ja/pilgrimage/spots/anitabi_215158_51i53xo8n",
      "/ja/pilgrimage/spots/stairs",
    ]);
    expect(grouped[1]?.countLabel).toBe("");
    expect(grouped[1]?.spots[0]?.href).toBe(
      "/ja/pilgrimage/spots/anitabi_321885_csisxbghx",
    );
    expect(
      placeNamesSimilar(
        { ja: "中津駅", zh: "中津站", en: "" },
        { ja: "大阪市中津地区", zh: "大阪市中津地区", en: "" },
      ),
    ).toBe(false);
  });

  it("counts same-place groups in the navigation catalog", () => {
    const catalog = parseNavCatalog(
      JSON.parse(readFileSync("public/data/seo/spots-nav.json", "utf8")),
    );
    const groups = clusterSamePlaces(catalog.spots);
    const multi = groups.filter((group) => group.length >= 2);
    const enoshima = multi.find((group) =>
      group.some((item) => item.id === "anitabi_215158_51i53xo8n"),
    );
    expect(
      enoshima?.some((item) => item.id === "anitabi_321885_csisxbghx"),
    ).toBe(true);
    expect(new Set(enoshima?.map((item) => item.id)).size).toBe(
      enoshima?.length,
    );
    expect(multi.length).toBe(1662);
    expect(enoshima?.map((item) => item.id).sort()).toEqual([
      "anitabi_212278_3aa8nhf3",
      "anitabi_215158_51i53xhbx",
      "anitabi_215158_51i53xo8n",
      "anitabi_321885_csisxbghx",
    ]);
    const works = groupPlaceWorks(
      enoshima ?? [],
      catalog.animes,
      "ja",
      (id) => `/ja/pilgrimage/spots/${id}`,
    );
    expect(works.map((work) => work.title).sort()).toEqual([
      "『Just Because!』",
      "『チェンソーマン』",
      "『刀使ノ巫女』",
    ]);
    const toji = works.find((work) => work.key === "215158");
    expect(toji?.countLabel).toBe("（2か所）");
    expect(toji?.spots.map((item) => item.place).sort()).toEqual(
      ["中津宮（江の島）", "中津宮階段"].sort(),
    );
    expect(toji?.spots.every((item) => item.href.includes(item.id))).toBe(true);
    expect(
      groupPlaceWorks(enoshima ?? [], catalog.animes, "zh-tw", (id) => id).find(
        (work) => work.key === "215158",
      )?.countLabel,
    ).toBe("（2處）");
    expect(groups.reduce((sum, group) => sum + group.length, 0)).toBe(
      catalog.spots.length,
    );
  });

  it("lists each work once, without brackets, and labels the overflow", () => {
    expect(
      dedupedWorkTitles([
        "『刀使ノ巫女』",
        "刀使ノ巫女",
        "『Just Because!』",
        "  ",
      ]),
    ).toEqual(["刀使ノ巫女", "Just Because!"]);
    const shown = formatPlaceWorkSubtitle(
      ["『Just Because!』", "『刀使ノ巫女』", "刀使ノ巫女", "『チェンソーマン』"],
      "ja",
    );
    expect(shown).toBe("Just Because! · 刀使ノ巫女 · チェンソーマン");
    expect(shown).not.toContain("『");
    expect(shown).not.toContain("中津宮階段");

    const musubi = [
      "ピンポン THE ANIMATION",
      "青春ブタ野郎はバニーガール先輩の夢を見ない",
    ];
    const musubiJoined = musubi.join(" · ");
    expect(formatPlaceWorkSubtitle(musubi, "ja")).toBe(musubiJoined);
    expect(formatPlaceWorkSubtitle(musubi, "ja", 60)).toBe(musubiJoined);
    expect(formatPlaceWorkSubtitle(musubi, "en")).not.toContain("more");

    const titles = ["Alpha", "Beta", "Gamma", "Delta"];
    expect(formatPlaceWorkSubtitle(titles, "ja", 20)).toBe(
      "Alpha · Beta · Gamma · Delta",
    );
    expect(formatPlaceWorkSubtitle(titles, "ja", 12)).toBe(
      "Alpha · ほか 3 作品",
    );
    expect(formatPlaceWorkSubtitle(titles, "en", 12)).toBe("Alpha · +3 more");
    expect(formatPlaceWorkSubtitle(titles, "zh", 12)).toBe("Alpha · 等 3 部");
    expect(formatPlaceWorkSubtitle(titles, "zh-tw", 12)).toBe(
      "Alpha · 等 3 部",
    );
    const css = readFileSync("src/styles/home-page.css", "utf8");
    expect(css).toMatch(
      /\.home-spot-sub,\s*\.place-work-sub \{[^}]*-webkit-line-clamp: 2;/s,
    );
  });

  it("keeps the open nearby sheet from stretching the card list", () => {
    const css = readFileSync("src/styles/home-page.css", "utf8");
    expect(css).toMatch(
      /\.home-nearby-sheet\.is-open \.home-spot-list \{\s*flex: 0 0 auto;/,
    );
    expect(css).toMatch(
      /\.home-nearby-sheet\.is-open \{\s*height: auto;\s*max-height: min\(78svh, 680px\);/,
    );
    const home = readFileSync("src/components/home/home-nearby.tsx", "utf8");
    const near = readFileSync(
      "src/components/pilgrimage/nearby-spots.tsx",
      "utf8",
    );
    const spotPage = readFileSync(
      "src/app/[locale]/pilgrimage/spots/[id]/page.tsx",
      "utf8",
    );
    expect(home).toContain("clusterSamePlaces");
    expect(home).toContain("/pilgrimage/spots/${encodeSpotId(id)}");
    expect(home).toContain("formatPlaceWorkSubtitle");
    expect(home).not.toContain("{item.place}");
    expect(near).toContain("clusterSamePlaces");
    expect(near).toContain("/pilgrimage/spots/${encodeSpotId(id)}");
    expect(near).toContain("formatPlaceWorkSubtitle");
    expect(near).not.toContain("{item.place}");
    expect(spotPage).not.toContain("NearbySpots");
    expect(spotPage).not.toContain("clusterSamePlaces");
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

  it("does not render anitabi attribution in the pilgrimage shell or homepage footer", () => {
    const shell = readFileSync(
      "src/app/[locale]/pilgrimage/_components/pilgrimage-ui.tsx",
      "utf8",
    );
    const footer = readFileSync("src/components/home/home-footer.tsx", "utf8");
    expect(shell).not.toContain("AnitabiAttribution");
    expect(shell).not.toContain("anitabi.cn");
    expect(footer).not.toContain("AnitabiAttribution");
    expect(footer).not.toContain("anitabi.cn");
    expect(getPilgrimageCopy("ja").samePlaceWorks).toBe(
      "同じ場所が登場する作品：",
    );
    expect(getPilgrimageCopy("ja").samePlaceSiblings).toBe(
      "同じ作品の近くのスポット：",
    );
    expect(getPilgrimageCopy("zh").samePlaceWorks).toBe("同一地点出现的作品：");
    expect(getPilgrimageCopy("zh-tw").samePlaceWorks).toBe(
      "同一地點出現的作品：",
    );
    expect(getPilgrimageCopy("en").samePlaceWorks).toBe(
      "Also in these works: ",
    );
    expect(getPilgrimageCopy("en").samePlaceSiblings).toBe(
      "Other spots from this work: ",
    );
    for (const locale of ["zh", "ja", "en", "zh-tw"] as const) {
      const copy = getPilgrimageCopy(locale);
      expect(copy.navigate.length).toBeGreaterThan(0);
      expect(copy.samePlaceWorks.includes("《")).toBe(false);
      expect(copy.samePlaceSiblings.includes("《")).toBe(false);
      expect(copy).not.toHaveProperty("samePlaceAlso");
      expect(copy.formatDistance(0.25)).toMatch(/250/);
      expect(copy).not.toHaveProperty("openAnitabi");
      expect(copy).not.toHaveProperty("creditLead");
    }
  });
});
