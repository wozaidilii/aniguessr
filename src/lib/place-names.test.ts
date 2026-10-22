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
    expect(localizePlaceName("京丹波町", "ja")).toBe("京丹波町");
    expect(localizePlaceName("京丹波町", "en")).toBe("京丹波町");
    expect(localizePlaceName("つくば市", "en", { lat: 36.0922, lng: 140.1015 })).toBe(
      "Tsukuba",
    );
    expect(localizePlaceName("丰乡町", "ja", { lat: 35.2034, lng: 136.2328 })).toBe(
      "豊郷町",
    );
    expect(localizePlaceName("京都市", "ja", { lat: 35.6442, lng: 140.0457 })).toBe(
      "京都市",
    );
    expect(localizePlaceName("京都市", "en", { lat: 35.6442, lng: 140.0457 })).toBe(
      "Kyoto",
    );
  });

  it("translates places outside Japan from a fixed table", () => {
    expect(localizePlaceName("中国", "en")).toBe("China");
    expect(localizePlaceName("中国", "ja")).toBe("中国");
    expect(localizePlaceName("中国", "zh-tw")).toBe("中國");
    expect(localizePlaceName("亚洲", "ja")).toBe("アジア");
    expect(localizePlaceName("亚洲", "zh-tw")).toBe("亞洲");
    expect(localizePlaceName("关岛", "en")).toBe("Guam");
    expect(localizePlaceName("关岛", "ja")).toBe("グアム");
    expect(localizePlaceName("关岛", "zh-tw")).toBe("關島");
    expect(localizePlaceName("吉林省", "en")).toBe("Jilin");
    expect(localizePlaceName("吉林省", "ja")).toBe("吉林省");
    expect(localizePlaceName("大洋洲", "ja")).toBe("オセアニア");
    expect(localizePlaceName("大洋洲", "en")).toBe("Oceania");
    expect(localizePlaceName("欧洲", "ja")).toBe("ヨーロッパ");
    expect(localizePlaceName("欧洲", "zh-tw")).toBe("歐洲");
    expect(localizePlaceName("江苏省", "ja")).toBe("江蘇省");
    expect(localizePlaceName("江苏省", "zh-tw")).toBe("江蘇省");
    expect(localizePlaceName("海外", "en")).toBe("Overseas");
    expect(localizePlaceName("海外", "ja")).toBe("海外");
    expect(localizePlaceName("海外", "zh")).toBe("海外");
    expect(localizePlaceName("辽宁省", "ja")).toBe("遼寧省");
    expect(localizePlaceName("辽宁省", "zh-tw")).toBe("遼寧省");
    expect(localizePlaceName("黑龙江省", "ja")).toBe("黑竜江省");
    expect(localizePlaceName("黑龙江省", "zh-tw")).toBe("黑龍江省");
    expect(localizePlaceName("黑龙江省", "zh")).toBe("黑龙江省");
  });

  it("covers the anime question locations without inventing romaji", () => {
    const bank = JSON.parse(
      readFileSync("public/data/anime-guessr-questions.json", "utf8"),
    ) as { questions: Array<{ location: string; lat: number; lng: number }> };
    const coverage = summarizePlaceCoverage(bank.questions);
    expect(coverage.uniqueLabels).toBe(514);
    expect(coverage.questions).toBe(24750);
    expect(coverage.byKind).toEqual({
      country: { labels: 1, questions: 2941 },
      prefecture: { labels: 31, questions: 6027 },
      municipality: { labels: 472, questions: 15587 },
      "prefecture-fallback": { labels: 0, questions: 0 },
      outside: { labels: 10, questions: 195 },
      unmatched: { labels: 0, questions: 0 },
    });
    expect(coverage.unmatchedLabels).toEqual([]);
    expect(coverage.byKind.country.questions).toBeGreaterThan(0);
    expect(coverage.byKind.prefecture.questions).toBeGreaterThan(0);
    expect(coverage.byKind.municipality.questions).toBeGreaterThan(0);
    expect(
        coverage.byKind.municipality.questions +
        coverage.byKind.prefecture.questions +
        coverage.byKind.country.questions +
        coverage.byKind["prefecture-fallback"].questions +
        coverage.byKind.outside.questions +
        coverage.byKind.unmatched.questions,
    ).toBe(coverage.questions);
  });
});
