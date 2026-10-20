import { describe, expect, it } from "vitest";
import { pickLocalizedLines, pickLocalizedText } from "~/lib/localized-text";

describe("localized text fallback", () => {
  const text = { zh: "镰仓", ja: "鎌倉", en: "" };

  it("prefers Japanese over Chinese on English pages", () => {
    expect(pickLocalizedText(text, "en")).toBe("鎌倉");
    expect(pickLocalizedText(text, "ja")).toBe("鎌倉");
    expect(pickLocalizedText(text, "zh")).toBe("镰仓");
  });

  it("uses English when it exists", () => {
    expect(
      pickLocalizedText({ zh: "东京", ja: "東京", en: "Tokyo" }, "en"),
    ).toBe("Tokyo");
  });

  it("returns Traditional text only for zh-TW and never falls back to simplified", () => {
    expect(
      pickLocalizedText({ zh: "镰仓", ja: "鎌倉", en: "Kamakura", tw: "鎌倉" }, "zh-tw"),
    ).toBe("鎌倉");
    expect(pickLocalizedText({ zh: "镰仓", ja: "鎌倉", en: "" }, "zh-tw")).toBe(
      "",
    );
    expect(
      pickLocalizedLines(
        { zh: ["简体"], ja: ["日本語"], en: [], tw: ["繁體"] },
        "zh-tw",
      ),
    ).toEqual(["繁體"]);
    expect(pickLocalizedLines(["简体"], "zh-tw")).toEqual([]);
  });

  it("falls funfacts through the same order", () => {
    expect(
      pickLocalizedLines({ zh: ["中文"], ja: ["日本語"], en: [] }, "en"),
    ).toEqual(["日本語"]);
    expect(pickLocalizedLines(["only"], "ja")).toEqual(["only"]);
  });
});
