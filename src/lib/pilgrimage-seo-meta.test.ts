import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ANIME_LOCALES } from "~/lib/anime-locale";
import {
  assignSpotSeoVariants,
  buildSpotSeo,
  codePointLength,
  PILGRIMAGE_SEO_TEMPLATES,
  SPOT_SEO_CHAR_LIMIT,
  spotEpisodeLabel,
  type SpotSeoFields,
} from "~/lib/pilgrimage-seo-meta";

function spot(
  partial: Partial<SpotSeoFields> & Pick<SpotSeoFields, "id">,
): SpotSeoFields {
  return {
    anime: "Clannad",
    place: "CLANNAD Slope",
    area: "Tokyo",
    episode: "",
    scene: "",
    ...partial,
  };
}

describe("pilgrimage seo templates", () => {
  it("keeps the brand suffix in every locale template", () => {
    for (const locale of ANIME_LOCALES) {
      const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
      expect(templates.spotTitle).toContain("AniGuessr");
      expect(templates.hubTitle).toContain("{brand}");
      expect(buildSpotSeo(locale, spot({ id: "a" }), "base").title).toContain(
        "AniGuessr",
      );
    }
  });

  it("uses the filming-location pattern and disambiguates collisions", () => {
    const shared = [
      spot({ id: "only", anime: "Only", place: "Bridge" }),
      spot({
        id: "ep-1",
        episode: "Episode 1",
        scene: "Sunset",
      }),
      spot({
        id: "ep-2",
        episode: "Episode 2",
        scene: "Rain",
      }),
      spot({
        id: "same-ep-a",
        anime: "K-On!",
        place: "School",
        episode: "Episode 4",
        scene: "Club room",
      }),
      spot({
        id: "same-ep-b",
        anime: "K-On!",
        place: "School",
        episode: "Episode 4",
        scene: "Stairwell",
      }),
    ];
    const variants = assignSpotSeoVariants(shared);
    expect(variants.get("only")).toBe("base");
    expect(variants.get("ep-1")).toBe("episode");
    expect(variants.get("ep-2")).toBe("episode");
    expect(variants.get("same-ep-a")).toBe("scene");
    expect(variants.get("same-ep-b")).toBe("scene");

    const titles = shared.map(
      (item) => buildSpotSeo("en", item, variants.get(item.id) ?? "id").title,
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles[0]).toBe("Bridge — Only Real-Life Location | AniGuessr");
    expect(buildSpotSeo("ja", shared[0]!, "base").title).toBe(
      "Only 聖地：Bridge（Tokyo）| AniGuessr",
    );
    expect(buildSpotSeo("zh", shared[0]!, "base").title).toBe(
      "Only圣地：Bridge（Tokyo）| AniGuessr",
    );
  });

  it("uses the SEO desk spot title and a street-view description", () => {
    expect(PILGRIMAGE_SEO_TEMPLATES.ja.spotTitle).toBe(
      "{anime} 聖地：{place}（{area}）| AniGuessr",
    );
    expect(PILGRIMAGE_SEO_TEMPLATES.zh.spotTitle).toBe(
      "{anime}圣地：{place}（{area}）| AniGuessr",
    );
    expect(PILGRIMAGE_SEO_TEMPLATES["zh-tw"].spotTitle).toBe(
      "{anime}聖地：{place}（{area}）| AniGuessr",
    );
    expect(PILGRIMAGE_SEO_TEMPLATES.en.spotTitle).toBe(
      "{place} — {anime} Real-Life Location | AniGuessr",
    );
    expect(PILGRIMAGE_SEO_TEMPLATES.ja.spotDescriptionWithId).toBe(
      "『{anime}』{episode}に登場する{place}。最寄りは{station}。ストリートビューで下見して、Googleマップでナビできます。",
    );

    const takeshita = buildSpotSeo(
      "ja",
      spot({
        id: "takeshita",
        anime: "アイドルマスター シンデレラガールズ",
        place: "竹下通り入口（原宿）",
        area: "東京都渋谷区",
        episode: "第3話、キャラクターの買い物シーン",
      }),
      "base",
    );
    expect(takeshita.title).toBe(
      "アイドルマスター シンデレラガールズ 聖地：竹下通り入口（原宿）| AniGuessr",
    );
    expect(takeshita.description).toBe(
      "『アイドルマスター シンデレラガールズ』第3話に登場する竹下通り入口（原宿）。東京都渋谷区。ストリートビューで下見して、Googleマップでナビできます。",
    );
    expect(takeshita.description.includes("最寄り")).toBe(false);

    const withStation = buildSpotSeo(
      "ja",
      spot({
        id: "station",
        anime: "作品",
        place: "入口",
        area: "渋谷区",
        episode: "第3話、約1分18秒",
        station: "原宿駅",
      }),
      "base",
    );
    expect(withStation.description).toBe(
      "『作品』第3話に登場する入口。最寄りは原宿駅。ストリートビューで下見して、Googleマップでナビできます。",
    );

    expect(spotEpisodeLabel("ja", "不明")).toBe("");
    expect(
      spotEpisodeLabel("en", "Episode 14, timestamp approx. 1020s (17:00)"),
    ).toBe("Episode 14");
    expect(spotEpisodeLabel("zh", "第14集，时间戳约1020秒（17:00）")).toBe(
      "第14集",
    );
    expect(spotEpisodeLabel("zh-tw", "第14集，時間戳約1020秒（17:00）")).toBe(
      "第14集",
    );

    const zhTw = buildSpotSeo(
      "zh-tw",
      spot({
        id: "tw",
        anime: "偶像大師 灰姑娘女孩",
        place: "竹下口（原宿）",
        area: "東京都澀谷區",
        episode: "第3話，角色外出購物場景",
      }),
      "base",
    );
    expect(zhTw.title).toBe(
      "偶像大師 灰姑娘女孩聖地：竹下口（原宿）| AniGuessr",
    );
    expect(zhTw.description).toContain("第3集");
    expect(zhTw.description).toContain("街景");
    expect(zhTw.description).toContain("Google 地圖");
    expect(zhTw.title).not.toContain("Anime Street-View Guessing Game");

    const long = buildSpotSeo(
      "ja",
      spot({
        id: "long",
        anime: "あ".repeat(80),
        place: "い".repeat(40),
        area: "う".repeat(20),
      }),
      "base",
    );
    expect(codePointLength(long.title)).toBeLessThanOrEqual(
      SPOT_SEO_CHAR_LIMIT.ja,
    );
    expect(long.title.includes("（")).toBe(false);
    expect(codePointLength(long.description)).toBeLessThanOrEqual(
      SPOT_SEO_CHAR_LIMIT.ja,
    );
  });

  it.skipIf(
    !existsSync(path.join(process.cwd(), "public/data/seo/index.json")),
  )("has no station field to mention on spot pages", () => {
    const index = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "public/data/seo/index.json"),
        "utf8",
      ),
    ) as { spots: Record<string, Record<string, unknown>> };
    const stationKeys = new Set<string>();
    for (const spotRecord of Object.values(index.spots)) {
      for (const key of Object.keys(spotRecord)) {
        if (/station|eki|駅/i.test(key)) stationKeys.add(key);
      }
    }
    expect([...stationKeys]).toEqual([]);
  });
});
