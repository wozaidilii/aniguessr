import { describe, expect, it } from "vitest";
import { buildAreaCard, buildSpotCard, buildWorkCard, emptyNames } from "~/lib/og/card";
import { OG_COPY } from "~/lib/og/copy";
import { pilgrimageOgPath } from "~/lib/og/metadata";
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
    expect(card.alt).toBe("镰仓高校前站的道口（青春猪头少年不会梦到兔女郎学姐）圣地地图");
    expect(card.subtitleLines.some((line) => line.suffix.includes("另有"))).toBe(true);
    expect(card.chip).not.toContain("巡禮");
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
    expect(work.stat.map((part) => part.text).join("")).toBe("1 real-life location");
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
    expect(area.stat.map((part) => part.text).join("")).toBe("4 series · 1 location");
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
    expect(JSON.stringify(OG_COPY)).not.toMatch(/株式会社|有限会社|Inc\.|Ltd\.|住所/);
    expect(emptyNames().ja).toBe("");
  });

  it("keeps a long multi-work suffix on the last line only", () => {
    const card = buildSpotCard({
      requestedLocale: "ja",
      spotName: names("江ノ島電鉄 鎌倉高校前駅 下りホーム東端から見た七里ヶ浜の海と江の島"),
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
    expect(suffixLines[0]?.suffix.replace(/\u00A0/gu, " ")).toBe("ほか 12 作品");
    expect(card.subtitleLines.at(-1)?.suffix).toBe(suffixLines[0]?.suffix);
    expect(card.titleLines.some((line) => line.endsWith("…"))).toBe(true);
  });
});
