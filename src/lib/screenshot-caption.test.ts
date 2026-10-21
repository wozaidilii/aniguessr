import { describe, expect, it } from "vitest";
import { screenshotCaption } from "~/lib/screenshot-caption";

describe("screenshot caption", () => {
  it("uses the work title when no rights holder is stored", () => {
    expect(screenshotCaption("アイドルマスター シンデレラガールズ")).toBe(
      "© アイドルマスター シンデレラガールズ",
    );
    expect(screenshotCaption("CLANNAD", "  ")).toBe("© CLANNAD");
    expect(screenshotCaption("CLANNAD")).not.toContain("製作委員会");
  });

  it("appends a rights holder only when the data already has one", () => {
    expect(screenshotCaption("CLANNAD", "Key")).toBe("CLANNAD © Key");
  });
});
