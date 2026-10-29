import { describe, expect, it } from "vitest";
import {
  HOME_IDEOGRAPH_FONT,
  HOME_MAP_STYLE,
  homePlaceNameField,
  homePlaceNameKey,
  tuneHomeMapStyle,
} from "~/lib/home-map-style";
import { OPENFREEMAP_POSITRON_STYLE } from "~/lib/openfreemap-basemap";

describe("homepage map style", () => {
  it("uses Positron as the OpenFreeMap fallback style", () => {
    expect(HOME_MAP_STYLE).toBe(OPENFREEMAP_POSITRON_STYLE);
    expect(HOME_MAP_STYLE).toBe(
      "https://tiles.openfreemap.org/styles/positron",
    );
    expect(HOME_MAP_STYLE).not.toContain("key=");
    expect(HOME_IDEOGRAPH_FONT).toBe(
      "Hiragino Sans, Noto Sans CJK JP, Noto Sans JP, Yu Gothic, Meiryo, sans-serif",
    );
  });

  it("can skip vector label tuning for the Google raster basemap", () => {
    const map = {
      getStyle: () => ({ layers: [] }),
      setPaintProperty: () => undefined,
      setLayoutProperty: () => undefined,
    };
    expect(() =>
      tuneHomeMapStyle(map as never, "ja", { skip: true }),
    ).not.toThrow();
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
