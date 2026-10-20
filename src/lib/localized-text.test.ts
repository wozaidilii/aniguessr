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

  it("falls funfacts through the same order", () => {
    expect(
      pickLocalizedLines({ zh: ["中文"], ja: ["日本語"], en: [] }, "en"),
    ).toEqual(["日本語"]);
    expect(pickLocalizedLines(["only"], "ja")).toEqual(["only"]);
  });
});
