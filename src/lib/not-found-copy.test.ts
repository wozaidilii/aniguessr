import { describe, expect, it } from "vitest";
import { getHomePageCopy } from "~/lib/home-page-copy";
import {
  notFoundCopy,
  notFoundHomeHref,
  notFoundWorksHref,
} from "~/lib/not-found-copy";

describe("not found copy", () => {
  it("uses the locale's home label and the nav's works label", () => {
    expect(notFoundCopy("ja").home).toBe("ホームへ戻る");
    expect(notFoundCopy("ja").works).toBe(getHomePageCopy("ja").navAnime);
    expect(notFoundCopy("zh").works).toBe(getHomePageCopy("zh").navAnime);
    expect(notFoundCopy("zh-tw").works).toBe(getHomePageCopy("zh-tw").navAnime);
    expect(notFoundCopy("en").works).toBe("Browse by title");
    expect(notFoundHomeHref("en")).toBe("/en");
    expect(notFoundWorksHref("zh-tw")).toBe("/zh-tw/pilgrimage/anime");
  });
});
