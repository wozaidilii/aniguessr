import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  JAPAN_PREFECTURES,
  localizePlaceName,
  matchPlaceName,
  summarizePlaceCoverage,
} from "~/lib/place-names";

describe("place names", () => {
  it("lists every prefecture once", () => {
    expect(JAPAN_PREFECTURES).toHaveLength(47);
    expect(new Set(JAPAN_PREFECTURES.map((row) => row.id)).size).toBe(47);
  });

  it("uses the fixed table for prefectures and the country", () => {
    expect(localizePlaceName("山梨县", "en")).toBe("Yamanashi");
    expect(localizePlaceName("山梨县", "ja")).toBe("山梨県");
    expect(localizePlaceName("山梨县", "zh")).toBe("山梨县");
    expect(localizePlaceName("山梨县", "zh-tw")).toBe("山梨縣");
    expect(localizePlaceName("东京都", "en")).toBe("Tokyo");
    expect(localizePlaceName("东京都", "ja")).toBe("東京都");
    expect(localizePlaceName("东京都", "zh-tw")).toBe("東京都");
    expect(localizePlaceName("日本", "en")).toBe("Japan");
    expect(localizePlaceName("日本", "zh")).toBe("日本");
    expect(localizePlaceName("日本", "zh-tw")).toBe("日本");
  });

  it("uses dataset romaji for municipalities and does not invent one", () => {
    expect(localizePlaceName("葛饰区", "en")).toBe("Katsushika");
    expect(localizePlaceName("葛饰区", "ja")).toBe("葛飾区");
    expect(localizePlaceName("葛饰区", "zh")).toBe("葛饰区");
    expect(localizePlaceName("葛饰区", "zh-tw")).toBe("葛飾區");
    expect(localizePlaceName("涩谷区", "en")).toBe("Shibuya");
    expect(localizePlaceName("东京府中市", "en")).toBe("Fuchu");
    expect(localizePlaceName("北海道伊达市", "ja")).toBe("伊達市");
    expect(localizePlaceName("北海道伊达市", "en")).toBe("Date");
    expect(matchPlaceName("海外", "en").kind).toBe("unmatched");
    expect(localizePlaceName("海外", "en")).toBe("海外");
  });

  it("covers the anime question locations without inventing romaji", () => {
    const bank = JSON.parse(
      readFileSync("public/data/anime-guessr-questions.json", "utf8"),
    ) as { questions: Array<{ location: string; lat: number; lng: number }> };
    const coverage = summarizePlaceCoverage(bank.questions);
    expect(coverage.uniqueLabels).toBe(209);
    expect(coverage.questions).toBe(24750);
    expect(coverage.byKind).toEqual({
      country: { labels: 1, questions: 2941 },
      prefecture: { labels: 31, questions: 7453 },
      municipality: { labels: 166, questions: 14145 },
      "prefecture-fallback": { labels: 1, questions: 16 },
      unmatched: { labels: 10, questions: 195 },
    });
    expect(coverage.unmatchedLabels).toEqual([
      "中国",
      "亚洲",
      "关岛",
      "吉林省",
      "大洋洲",
      "欧洲",
      "江苏省",
      "海外",
      "辽宁省",
      "黑龙江省",
    ]);
    expect(coverage.byKind.country.questions).toBeGreaterThan(0);
    expect(coverage.byKind.prefecture.questions).toBeGreaterThan(0);
    expect(coverage.byKind.municipality.questions).toBeGreaterThan(0);
    expect(
      coverage.byKind.municipality.questions +
        coverage.byKind.prefecture.questions +
        coverage.byKind.country.questions +
        coverage.byKind["prefecture-fallback"].questions +
        coverage.byKind.unmatched.questions,
    ).toBe(coverage.questions);
  });
});
