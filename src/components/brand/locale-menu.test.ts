import { describe, expect, it } from "vitest";
import {
  gameLocaleMenuLinks,
  hrefLangForLocale,
} from "~/components/brand/LocaleMenu";

describe("gameLocaleMenuLinks", () => {
  it("keeps the switcher labels and hreflang targets", () => {
    const links = gameLocaleMenuLinks("/ja/game/anime", "rounds=10");
    expect(links.map((item) => item.label)).toEqual([
      "日本語",
      "EN",
      "简中",
      "繁中",
    ]);
    expect(links.map((item) => item.href)).toEqual([
      "/ja/game/anime?rounds=10",
      "/en/game/anime?rounds=10",
      "/zh/game/anime?rounds=10",
      "/zh-tw/game/anime?rounds=10",
    ]);
    expect(links.map((item) => item.hrefLang)).toEqual([
      "ja",
      "en",
      "zh",
      "zh-Hant",
    ]);
    expect(hrefLangForLocale("zh-tw")).toBe("zh-Hant");
  });

  it("omits an empty query string", () => {
    expect(
      gameLocaleMenuLinks("/en/game/anime").map((item) => item.href),
    ).toEqual([
      "/ja/game/anime",
      "/en/game/anime",
      "/zh/game/anime",
      "/zh-tw/game/anime",
    ]);
  });
});
