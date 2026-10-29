import { describe, expect, it } from "vitest";
import {
  isAffiliateThumbnailRegion,
  resolveAffiliateThumbnail,
} from "~/lib/affiliate/thumbnail";

describe("affiliate thumbnail mapping", () => {
  it("maps pilot location slugs to webp assets and locale alts", () => {
    expect(resolveAffiliateThumbnail("kamakura-kanagawa", "ja")).toEqual({
      region: "kamakura-kanagawa",
      src: "/images/affiliate/kamakura.webp",
      alt: "鎌倉",
    });
    expect(resolveAffiliateThumbnail("fujisawa-kanagawa", "en")).toMatchObject({
      src: "/images/affiliate/fujisawa.webp",
      alt: "Enoshima",
    });
    expect(resolveAffiliateThumbnail("shibuya-tokyo", "zh")).toMatchObject({
      alt: "涩谷",
    });
    expect(resolveAffiliateThumbnail("kyoto-kyoto", "zh-tw")).toMatchObject({
      alt: "京都",
    });
  });

  it("falls back to the icon row for non-pilot allowlist regions", () => {
    expect(resolveAffiliateThumbnail("uji-kyoto", "ja")).toBeNull();
    expect(isAffiliateThumbnailRegion("kamakura-kanagawa")).toBe(true);
    expect(isAffiliateThumbnailRegion("chiba-chiba-12106")).toBe(false);
  });
});
