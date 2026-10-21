import { describe, expect, it } from "vitest";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  getHomePageCopy,
  homePageMetadata,
  HOME_SEO,
} from "~/lib/home-page-copy";

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
      "Anime Pilgrimage Map: Real-Life Anime Locations Near You | AniGuessr",
    );
    expect(HOME_SEO.en.description).toBe(
      "See real-life anime locations across Japan on one map, find the spots near you, and get directions in Google Maps. Browse by series or by area.",
    );
    expect(getHomePageCopy("en").animeTitle).toBe(
      "Real-life locations from popular anime",
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

  it("uses the locked work-search and popular-anime copy", () => {
    expect(getHomePageCopy("ja").searchWorks).toBe("作品名で検索");
    expect(getHomePageCopy("zh").searchWorks).toBe("搜索作品名");
    expect(getHomePageCopy("zh-tw").searchWorks).toBe("搜尋作品名稱");
    expect(getHomePageCopy("en").searchWorks).toBe("Search anime titles");
    expect(getHomePageCopy("ja").searchWorksEmpty).toBe(
      "該当する作品が見つかりません",
    );
    expect(getHomePageCopy("zh").popularWorks).toBe("热门作品");
    expect(getHomePageCopy("zh-tw").popularWorks).toBe("熱門作品");
    expect(getHomePageCopy("en").popularWorks).toBe("Popular anime");
    expect(getHomePageCopy("ja").myLocation).toBe("現在地");
    expect(getHomePageCopy("zh").myLocation).toBe("我的位置");
    expect(getHomePageCopy("en").myLocation).toBe("My location");
    expect(getPilgrimageCopy("ja").alsoKnownAs).toBe("別名");
    expect(getPilgrimageCopy("zh").alsoKnownAs).toBe("别名");
    expect(getPilgrimageCopy("en").alsoKnownAs).toBe("Also known as");
    expect(getPilgrimageCopy("zh-tw").searchWorksEmpty).toBe("找不到相關作品");
  });
});
