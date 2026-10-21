import { describe, expect, it } from "vitest";
import { getHomePageCopy, homePageMetadata, HOME_SEO } from "~/lib/home-page-copy";

describe("homepage copy", () => {
  it("keeps the game heading and uses the clue-guessing description", () => {
    expect(getHomePageCopy("ja").gameTitle).toBe("聖地当てゲームでも遊べます");
    expect(getHomePageCopy("ja").gameBody).toBe(
      "アニメのヒントから、どこの聖地か当ててみよう。",
    );
    expect(getHomePageCopy("zh").gameBody).toBe(
      "根据动画线索，猜猜这是哪里的圣地。",
    );
    expect(getHomePageCopy("zh-tw").gameBody).toBe(
      "根據動畫線索，猜猜這是哪裡的聖地。",
    );
    expect(getHomePageCopy("en").gameBody).toBe(
      "Use the anime clues to guess where the real spot is.",
    );
  });

  it("publishes the locked titles and descriptions, including zh-TW hreflang", () => {
    expect(HOME_SEO.ja.title).toBe(
      "アニメ聖地巡礼マップ｜近くの聖地を探す - AniGuessr",
    );
    expect(HOME_SEO.en.title).toBe(
      "Anime Pilgrimage Map: Real Life Anime Locations Near You | AniGuessr",
    );
    const english = homePageMetadata("en");
    expect(english.title).toEqual({ absolute: HOME_SEO.en.title });
    expect(english.description).toBe(HOME_SEO.en.description);
    expect(english.alternates?.canonical).toBe("/en");
    expect(english.alternates?.languages).toMatchObject({
      ja: "https://aniguessr.ayiora.com/ja",
      zh: "https://aniguessr.ayiora.com/zh",
      en: "https://aniguessr.ayiora.com/en",
      "x-default": "https://aniguessr.ayiora.com/en",
      "zh-Hant": "https://aniguessr.ayiora.com/zh-tw",
      "zh-TW": "https://aniguessr.ayiora.com/zh-tw",
    });
    expect(homePageMetadata("zh-tw").alternates?.canonical).toBe("/zh-tw");
  });
});
