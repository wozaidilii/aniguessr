import { describe, expect, it } from "vitest";
import {
  matchAnimeTitles,
  normalizeAnimeSearchText,
  otherAnimeTitles,
  type AnimeSearchRecord,
} from "~/lib/anime-title-search";

const monogatari: AnimeSearchRecord = {
  subjectId: "1671",
  titles: {
    zh: "化物语",
    ja: "化物語",
    en: "Bakemonogatari",
    tw: "化物語",
  },
};

const series: AnimeSearchRecord = {
  subjectId: "2",
  titles: {
    zh: "物语系列",
    ja: "物語シリーズ",
    en: "Monogatari Series",
    tw: "物語系列",
  },
};

describe("anime title search", () => {
  it("finds subject 1671 across romaji, kanji, simplified, and substrings", () => {
    const items = [series, monogatari];
    for (const query of [
      "Bakemonogatari",
      "bakemonogatari",
      "Ｂａｋｅｍｏｎｏｇａｔａｒｉ",
      "化物語",
      "化物语",
      "物语",
      "物語",
    ]) {
      expect(
        matchAnimeTitles(items, query).map((item) => item.subjectId),
      ).toContain("1671");
    }
  });

  it("ranks exact matches before prefix, then substring", () => {
    const items: AnimeSearchRecord[] = [
      { subjectId: "prefix", titles: { en: "Bakemonogatari Extra" } },
      { subjectId: "sub", titles: { en: "The Bakemonogatari Guide" } },
      monogatari,
    ];
    expect(
      matchAnimeTitles(items, "Bakemonogatari").map((item) => item.subjectId),
    ).toEqual(["1671", "prefix", "sub"]);
  });

  it("ranks a prefix title ahead of a later substring", () => {
    expect(
      matchAnimeTitles([monogatari, series], "物語").map(
        (item) => item.subjectId,
      ),
    ).toEqual(["2", "1671"]);
  });

  it("matches aliases and caps the result list", () => {
    const items: AnimeSearchRecord[] = [
      {
        subjectId: "alias",
        titles: { en: "Other" },
        aliases: ["Bakemonogatari"],
      },
      ...Array.from({ length: 10 }, (_, index) => ({
        subjectId: `extra-${index}`,
        titles: { en: `Bakemonogatari ${index}` },
      })),
    ];
    const matched = matchAnimeTitles(items, "Bakemonogatari", 8);
    expect(matched).toHaveLength(8);
    expect(matched[0]?.subjectId).toBe("alias");
  });

  it("folds simplified and traditional characters and ignores case", () => {
    expect(normalizeAnimeSearchText("化物語")).toBe(
      normalizeAnimeSearchText("化物语"),
    );
    expect(normalizeAnimeSearchText("咒術迴戰")).toBe(
      normalizeAnimeSearchText("咒术回战"),
    );
    expect(matchAnimeTitles([], "   ")).toEqual([]);
  });

  it("lists the other-language titles without repeating the locale title", () => {
    expect(otherAnimeTitles(monogatari.titles, "zh")).toEqual([
      "化物語",
      "Bakemonogatari",
    ]);
    expect(otherAnimeTitles(monogatari.titles, "en")).toEqual([
      "化物語",
      "化物语",
    ]);
    expect(otherAnimeTitles(monogatari.titles, "ja")).toEqual([
      "化物语",
      "Bakemonogatari",
    ]);
  });
});
