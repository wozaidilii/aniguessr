import { describe, expect, it } from "vitest";
import {
  notFoundCopy,
  notFoundHomeHref,
  notFoundWorksHref,
} from "~/lib/not-found-copy";

describe("not found copy", () => {
  it("uses the locale's home and works labels", () => {
    expect(notFoundCopy("ja").home).toBe("ホームへ戻る");
    expect(notFoundCopy("ja").works).toBe("作品から探す");
    expect(notFoundCopy("zh").works).toBe("按番剧浏览");
    expect(notFoundCopy("zh-tw").works).toBe("按番劇瀏覽");
    expect(notFoundCopy("en").works).toBe("Browse by anime");
    expect(notFoundHomeHref("en")).toBe("/en");
    expect(notFoundWorksHref("zh-tw")).toBe("/zh-tw/pilgrimage/anime");
  });
});
