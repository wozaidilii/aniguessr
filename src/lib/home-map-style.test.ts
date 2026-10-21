import { describe, expect, it } from "vitest";
import {
  HOME_IDEOGRAPH_FONT,
  HOME_MAP_STYLE,
  homePlaceNameField,
  homePlaceNameKey,
} from "~/lib/home-map-style";

describe("homepage map style", () => {
  it("uses the light OpenFreeMap style and a CJK fallback font", () => {
    expect(HOME_MAP_STYLE).toBe(
      "https://tiles.openfreemap.org/styles/positron",
    );
    expect(HOME_MAP_STYLE).not.toContain("key=");
    expect(HOME_IDEOGRAPH_FONT).toBe("Hiragino Sans, Noto Sans CJK JP");
  });

  it("prefers the locale name and falls back to name", () => {
    expect(homePlaceNameKey("ja")).toBe("name:ja");
    expect(homePlaceNameKey("zh")).toBe("name:zh");
    expect(homePlaceNameKey("zh-tw")).toBe("name:zh-Hant");
    expect(homePlaceNameKey("en")).toBe("name:en");
    expect(homePlaceNameField("zh-tw")).toEqual([
      "coalesce",
      ["get", "name:zh-Hant"],
      ["get", "name"],
    ]);
  });
});
