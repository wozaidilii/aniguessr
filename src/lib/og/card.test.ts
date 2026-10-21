import { describe, expect, it } from "vitest";
import {
  buildAreaCard,
  buildHomeCard,
  buildSpotCard,
  buildWorkCard,
  emptyNames,
} from "~/lib/og/card";
import { OG_COPY } from "~/lib/og/copy";
import { homeHeadingText } from "~/lib/home-page-copy";
import {
  HOME_OG_ASSET_VERSION,
  homeOgFallbackPath,
  homeOgStaticPublicPath,
  pilgrimageOgPath,
  withHomeOg,
} from "~/lib/og/metadata";
import { absoluteUrl } from "~/lib/seo";
import { otherWorkCounts } from "~/lib/og/map";

function names(ja: string, zh = "", tw = "", en = "") {
  return { ja, zh, "zh-tw": tw, en };
}

describe("og cards", () => {
  it("uses one fallback locale for Traditional text and alt", () => {
    const card = buildSpotCard({
      requestedLocale: "zh-tw",
      spotName: names("", "镰仓高校前站的道口"),
      workTitle: names("", "青春猪头少年不会梦到兔女郎学姐"),
      areaName: names("", "镰仓・江之岛"),
      otherWorkCount: 2,
      art: "coast",
      origin: { lat: 35.3, lng: 139.5 },
      nearby: [],
    });
    expect(card.contentLocale).toBe("zh");
    expect(card.chip).toBe(OG_COPY.zh.chipSpot);
    expect(card.alt).toBe(
      "镰仓高校前站的道口（青春猪头少年不会梦到兔女郎学姐）圣地地图",
    );
    expect(
      card.subtitleLines.some((line) => line.suffix.includes("另有")),
    ).toBe(true);
    expect(card.chip).not.toContain("巡禮");
  });

  it("fills a blank Japanese place name without leaving the Japanese card", () => {
    const card = buildSpotCard({
      requestedLocale: "ja",
      spotName: names("", "稲村ヶ崎", "稲村ヶ崎", "Inamuragasaki"),
      workTitle: names("四月は君の嘘", "四月是你的谎言"),
      areaName: names("鎌倉市", "镰仓市"),
      otherWorkCount: 0,
      art: "city",
      origin: { lat: 35.3, lng: 139.5 },
      nearby: [],
    });
    expect(card.contentLocale).toBe("ja");
    expect(card.chip).toBe("聖地巡礼スポット");
    expect(card.titleLines.join("")).toBe("稲村ヶ崎");
    expect(card.alt).toBe("稲村ヶ崎（四月は君の嘘）の聖地の地図");
  });

  it("uses a derived Japanese label before romaji", () => {
    const card = buildSpotCard({
      requestedLocale: "ja",
      spotName: names("", "", "", "Inamuragasaki"),
      workTitle: names("四月は君の嘘"),
      areaName: names("鎌倉市"),
      otherWorkCount: 0,
      art: "coast",
      origin: { lat: 35.3, lng: 139.5 },
      nearby: [],
      derivedJa: "稲村ヶ崎の海岸",
    });
    expect(card.contentLocale).toBe("ja");
    expect(card.titleLines.join("")).toBe("稲村ヶ崎の海岸");
    expect(card.alt).not.toContain("Inamuragasaki");
  });

  it("switches an English request to a Japanese card when English names are missing", () => {
    const card = buildSpotCard({
      requestedLocale: "en",
      spotName: names("踏切"),
      workTitle: names("青春ブタ"),
      areaName: names("鎌倉"),
      otherWorkCount: 0,
      art: "city",
      origin: { lat: 35.3, lng: 139.5 },
      nearby: [],
    });
    expect(card.contentLocale).toBe("ja");
    expect(card.chip).toBe("聖地巡礼スポット");
    expect(card.alt).toBe("踏切（青春ブタ）の聖地の地図");
  });

  it("falls zh-tw anime titles through zh before ja and drops a Japanese-only pill", () => {
    const card = buildWorkCard({
      requestedLocale: "zh-tw",
      title: names("四月は君の嘘", "四月是你的谎言", ""),
      spotCount: 12,
      areas: [names("鎌倉市", "", "")],
      points: [{ lat: 35.3, lng: 139.5 }],
      art: "coast",
    });
    expect(card.contentLocale).toBe("zh");
    expect(card.chip).toBe(OG_COPY.zh.chipWork);
    expect(card.titleLines.join("")).toBe("四月是你的谎言");
    expect(card.alt).toBe("四月是你的谎言的 12 处圣地地图");
    expect(card.alt).not.toContain("四月は君の嘘");
    expect(card.alt).not.toContain("か所");
    expect(card.pills).toEqual([]);
  });

  it("uses simplified yuru camp when Traditional is only the Japanese title", () => {
    const card = buildWorkCard({
      requestedLocale: "zh-tw",
      title: names("ゆるキャン△", "摇曳露营", ""),
      spotCount: 20,
      areas: [names("山梨", "山梨", "山梨")],
      points: [{ lat: 35.6, lng: 138.5 }],
      art: "city",
    });
    expect(card.contentLocale).toBe("zh");
    expect(card.titleLines.join("")).toContain("摇曳露营");
    expect(card.chip).toBe("动漫圣地");
    expect(card.pills).toEqual(["山梨"]);
  });

  it("keeps Traditional when every name exists", () => {
    const card = buildSpotCard({
      requestedLocale: "zh-tw",
      spotName: names("鎌倉", "镰仓", "鎌倉"),
      workTitle: names("作品", "作品", "作品"),
      areaName: names("江ノ島", "江之岛", "江之島"),
      otherWorkCount: 0,
      art: "city",
      origin: { lat: 35.3, lng: 139.5 },
      nearby: [],
    });
    expect(card.contentLocale).toBe("zh-tw");
    expect(card.chip).toBe("聖地巡禮地點");
    expect(card.subtitleLines.every((line) => line.suffix === "")).toBe(true);
  });

  it("uses English singular copy and alt when the count is 1", () => {
    const work = buildWorkCard({
      requestedLocale: "en",
      title: names("作品", "作品", "作品", "Only Yesterday"),
      spotCount: 1,
      areas: [names("鎌倉", "镰仓", "鎌倉", "Kamakura")],
      points: [{ lat: 35.3, lng: 139.5 }],
      art: "coast",
    });
    expect(work.stat.map((part) => part.text).join("")).toBe(
      "1 real-life location",
    );
    expect(work.alt).toBe("Map of 1 real-life location from Only Yesterday");
    const area = buildAreaCard({
      requestedLocale: "en",
      title: names("鎌倉", "镰仓", "鎌倉", "Kamakura"),
      workCount: 4,
      spotCount: 1,
      works: [],
      points: [{ lat: 35.3, lng: 139.5 }],
      art: "city",
    });
    expect(area.stat.map((part) => part.text).join("")).toBe(
      "4 series · 1 location",
    );
    expect(area.alt).toBe("Anime pilgrimage map of Kamakura");
  });

  it("counts related works minus one and skips a zero suffix", () => {
    const counts = otherWorkCounts([
      { id: "a", workId: "1", lat: 35.3, lng: 139.5 },
      { id: "b", workId: "2", lat: 35.3001, lng: 139.5001 },
      { id: "c", workId: "1", lat: 35.301, lng: 139.501 },
      { id: "d", workId: "3", lat: 36.5, lng: 140.2 },
    ]);
    expect(counts.get("a")).toBe(1);
    expect(counts.get("d")).toBe(0);
    const card = buildSpotCard({
      requestedLocale: "ja",
      spotName: names("踏切"),
      workTitle: names("青春ブタ"),
      areaName: names("鎌倉"),
      otherWorkCount: counts.get("d") ?? 0,
      art: "city",
      origin: { lat: 36.5, lng: 140.2 },
      nearby: [],
    });
    expect(card.subtitleLines.every((line) => line.suffix === "")).toBe(true);
  });

  it("puts only the generated card on a versioned absolute path", () => {
    const card = buildAreaCard({
      requestedLocale: "ja",
      title: names("鎌倉・江ノ島"),
      workCount: 38,
      spotCount: 412,
      works: [names("青春ブタ野郎はバニーガール先輩の夢を見ない")],
      points: [
        { lat: 35.31, lng: 139.48 },
        { lat: 35.32, lng: 139.5 },
      ],
      art: "coast",
    });
    const path = pilgrimageOgPath("ja", "locations", "kamakura", card.version);
    expect(path).toContain("/ja/pilgrimage/locations/");
    expect(path).toContain("opengraph-image?v=");
    expect(path).not.toContain("anitabi");
    expect(JSON.stringify(OG_COPY)).not.toMatch(
      /株式会社|有限会社|Inc\.|Ltd\.|住所/,
    );
    expect(emptyNames().ja).toBe("");
  });

  it("builds a one-language homepage card and prefers a static file stamp", () => {
    const card = buildHomeCard({
      requestedLocale: "zh-tw",
      spotCount: 1200,
      points: [
        { lat: 35.3, lng: 139.48 },
        { lat: 35.32, lng: 139.55 },
        { lat: 35.68, lng: 139.76 },
      ],
    });
    expect(card.kind).toBe("home");
    expect(card.contentLocale).toBe("zh-tw");
    expect(card.art).toBe("coast");
    expect(card.chip).toBe("動漫聖地巡禮地圖");
    expect(card.titleLines.join("")).toBe("動漫聖地巡禮地圖");
    expect(card.alt).toBe("動漫聖地巡禮地圖");
    expect(card.stat.map((part) => part.text).join("")).toContain("處聖地");
    expect(card.pills).toEqual([]);
    expect(homeHeadingText("zh-tw")).toBe("動漫聖地巡禮地圖");
    expect(homeHeadingText("ja")).toBe("アニメ聖地巡礼マップ");
    expect(homeHeadingText("zh")).toBe("动漫圣地巡礼地图");
    expect(homeHeadingText("en")).toBe("Anime Pilgrimage Map");
    expect(HOME_OG_ASSET_VERSION).toBe("1");
    expect(homeOgStaticPublicPath("ja")).toBe("/og/home-ja.png?v=1");
    expect(homeOgStaticPublicPath("zh-tw")).toBe("/og/home-zh-tw.png?v=1");
    expect(homeOgFallbackPath("en", card.version)).toBe(
      `/en/opengraph-image?v=${encodeURIComponent(card.version)}`,
    );
    const staticMeta = withHomeOg({}, "ja", { staticArt: true });
    const staticImage = {
      url: absoluteUrl("/og/home-ja.png?v=1"),
      type: "image/png",
      width: 1200,
      height: 630,
      alt: "アニメ聖地巡礼マップ",
    };
    expect(staticMeta.openGraph?.images).toEqual([staticImage]);
    expect(staticMeta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [{ url: staticImage.url, alt: staticImage.alt }],
    });
    const fallback = withHomeOg({}, "en", {
      staticArt: false,
      version: card.version,
    });
    expect(fallback.openGraph?.images).toEqual([
      {
        url: absoluteUrl(homeOgFallbackPath("en", card.version)),
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Anime Pilgrimage Map",
      },
    ]);
    const english = buildHomeCard({ requestedLocale: "en", spotCount: 2 });
    expect(english.titleLines.join(" ")).toContain("Anime");
    expect(english.alt).toBe("Anime Pilgrimage Map");
  });

  it("keeps a long multi-work suffix on the last line only", () => {
    const card = buildSpotCard({
      requestedLocale: "ja",
      spotName: names(
        "江ノ島電鉄 鎌倉高校前駅 下りホーム東端から見た七里ヶ浜の海と江の島",
      ),
      workTitle: names(
        "ラブライブ！虹ヶ咲学園スクールアイドル同好会 完結編 第1章 劇場版スペシャルエディション",
      ),
      areaName: names("鎌倉・江ノ島"),
      otherWorkCount: 12,
      art: "coast",
      origin: { lat: 35.306, lng: 139.498 },
      nearby: [],
    });
    const suffixLines = card.subtitleLines.filter((line) => line.suffix);
    expect(suffixLines).toHaveLength(1);
    expect(suffixLines[0]?.suffix.replace(/\u00A0/gu, " ")).toBe(
      "ほか 12 作品",
    );
    expect(card.subtitleLines.at(-1)?.suffix).toBe(suffixLines[0]?.suffix);
    expect(card.titleLines.some((line) => line.endsWith("…"))).toBe(true);
  });
});
