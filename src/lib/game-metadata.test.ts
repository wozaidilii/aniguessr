import { describe, expect, it } from "vitest";
import { gameAnimeMetadata } from "~/lib/game-metadata";

describe("game anime metadata", () => {
  it("keeps zh-tw on its own canonical and hreflang set", () => {
    const metadata = gameAnimeMetadata("zh-tw");
    expect(metadata.alternates?.canonical).toBe("/zh-tw/game/anime");
    expect(metadata.alternates?.languages).toMatchObject({
      ja: "https://aniguessr.ayiora.com/ja/game/anime",
      zh: "https://aniguessr.ayiora.com/zh/game/anime",
      en: "https://aniguessr.ayiora.com/en/game/anime",
      "x-default": "https://aniguessr.ayiora.com/en/game/anime",
      "zh-Hant": "https://aniguessr.ayiora.com/zh-tw/game/anime",
      "zh-TW": "https://aniguessr.ayiora.com/zh-tw/game/anime",
    });
    expect(metadata.title).toEqual({ absolute: "猜動漫模式 - AniGuessr" });
  });

  it("keeps ja canonical on the anime locale prefix", () => {
    expect(gameAnimeMetadata("ja").alternates?.canonical).toBe(
      "/ja/game/anime",
    );
  });
});
