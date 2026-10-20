import { describe, expect, it } from "vitest";
import { toZhTw } from "./zh-tw.mjs";
import { zhTwAnimeTitle } from "./zh-tw-anime-title.mjs";

describe("zh-TW anime titles", () => {
  it("uses the Taiwan official title and never OpenCC of simplified", () => {
    const titles = {
      zh: "青春笨蛋少年不做兔女郎学姐的梦",
      ja: "青春ブタ野郎はバニーガール先輩の夢を見ない",
      en: "Rascal Does Not Dream of Bunny Girl Senpai",
    };
    const chosen = zhTwAnimeTitle("240038", titles);
    expect(chosen).toEqual({
      text: "青春豬頭少年不會夢到兔女郎學姊",
      source: "official-title",
    });
    expect(chosen.text).not.toBe(toZhTw(titles.zh));
    expect(zhTwAnimeTitle("1608", { zh: "灌篮高手", ja: "スラムダンク" })).toEqual({
      text: "灌籃高手",
      source: "official-title",
    });
  });

  it("falls back to Japanese when the map has no entry", () => {
    const titles = {
      zh: "孤独摇滚！",
      ja: "ぼっち・ざ・ろっく！",
      en: "Bocchi the Rock!",
    };
    expect(zhTwAnimeTitle("328609", titles)).toEqual({
      text: "ぼっち・ざ・ろっく！",
      source: "ja-fallback",
    });
    expect(zhTwAnimeTitle(["999999", "328609"], titles).text).toBe(
      "ぼっち・ざ・ろっく！",
    );
    expect(zhTwAnimeTitle("328609", { zh: "孤独摇滚！", ja: "" }).text).toBe("");
  });
});
