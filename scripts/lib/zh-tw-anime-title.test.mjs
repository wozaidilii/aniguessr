import { describe, expect, it } from "vitest";
import { toZhTw } from "./zh-tw.mjs";
import { zhTwAnimeTitle } from "./zh-tw-anime-title.mjs";

describe("zh-TW anime titles", () => {
  it("prefers an explicit traditional title over the override map and OpenCC", () => {
    const chosen = zhTwAnimeTitle("294993", {
      tw: "明示標題",
      zh: "咒术回战",
      ja: "呪術廻戦",
    });
    expect(chosen).toEqual({ text: "明示標題", source: "explicit" });
  });

  it("uses the manual override, including a merged member id", () => {
    const titles = {
      zh: "青春笨蛋少年不做兔女郎学姐的梦",
      ja: "青春ブタ野郎はバニーガール先輩の夢を見ない",
      en: "Rascal Does Not Dream of Bunny Girl Senpai",
    };
    const chosen = zhTwAnimeTitle("240038", titles);
    expect(chosen).toEqual({
      text: "青春豬頭少年不會夢到兔女郎學姐",
      source: "override",
    });
    expect(chosen.text).not.toBe(toZhTw(titles.zh));
    expect(zhTwAnimeTitle(["999999", "328609"], {
      zh: "孤独摇滚！",
      ja: "ぼっち・ざ・ろっく！",
    })).toEqual({ text: "孤獨搖滾！", source: "override" });
    expect(zhTwAnimeTitle("1608", { zh: "灌篮高手", ja: "スラムダンク" })).toEqual({
      text: "灌籃高手",
      source: "override",
    });
  });

  it("converts simplified Chinese with OpenCC s2twp before Japanese", () => {
    expect(
      zhTwAnimeTitle("999001", {
        zh: "孤独摇滚！",
        ja: "ぼっち・ざ・ろっく！",
      }),
    ).toEqual({ text: "孤獨搖滾！", source: "opencc" });
    expect(zhTwAnimeTitle("999001", { zh: "灌篮高手", ja: "スラムダンク" }).text).toBe(
      "灌籃高手",
    );
  });

  it("falls back to Japanese when simplified text is missing", () => {
    expect(zhTwAnimeTitle("999001", { zh: "", ja: "ぼっち・ざ・ろっく！" })).toEqual({
      text: "ぼっち・ざ・ろっく！",
      source: "ja",
    });
    expect(zhTwAnimeTitle("999001", { zh: "   ", ja: "" }).text).toBe("");
  });
});
