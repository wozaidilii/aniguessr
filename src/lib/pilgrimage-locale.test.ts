import { describe, expect, it } from "vitest";
import {
  pilgrimagePageMetadata,
  zhTwOnlyPageMetadata,
} from "~/lib/seo";
import {
  isZhTwCoveredLocationSlug,
  splitLocalePath,
  withPilgrimageLocale,
} from "~/lib/pilgrimage-locale";

describe("pilgrimage zh-TW locale", () => {
  it("treats /zh-tw as its own prefix and does not cover other cities", () => {
    expect(splitLocalePath("/zh-tw/pilgrimage/locations/fujisawa-kanagawa")).toEqual({
      locale: "zh-tw",
      pathname: "/pilgrimage/locations/fujisawa-kanagawa",
    });
    expect(withPilgrimageLocale("/pilgrimage", "zh-tw")).toBe("/zh-tw/pilgrimage");
    expect(isZhTwCoveredLocationSlug("kamakura-kanagawa")).toBe(true);
    expect(isZhTwCoveredLocationSlug("fujisawa-kanagawa")).toBe(true);
    expect(isZhTwCoveredLocationSlug("shinjuku-tokyo")).toBe(false);
  });

  it("advertises zh-Hant only on pages that have a zh-TW version", () => {
    const covered = pilgrimagePageMetadata(
      "en",
      "/pilgrimage/locations/fujisawa-kanagawa",
      "Enoshima",
      "desc",
      true,
    );
    const languages = covered.alternates?.languages ?? {};
    expect(languages["zh-TW"]).toBe(
      "https://aniguessr.ayiora.com/zh-tw/pilgrimage/locations/fujisawa-kanagawa",
    );
    expect(languages["zh-Hant"]).toBe(languages["zh-TW"]);
    expect(languages.en).toBe(
      "https://aniguessr.ayiora.com/en/pilgrimage/locations/fujisawa-kanagawa",
    );

    const uncovered = pilgrimagePageMetadata(
      "zh",
      "/pilgrimage/locations/shinjuku-tokyo",
      "Shinjuku",
      "desc",
      false,
    );
    expect(uncovered.alternates?.languages?.["zh-TW"]).toBeUndefined();
    expect(uncovered.alternates?.languages?.["zh-Hant"]).toBeUndefined();

    const area = zhTwOnlyPageMetadata("/pilgrimage", "鎌倉", "江之島");
    expect(area.alternates?.canonical).toBe("/zh-tw/pilgrimage");
    expect(area.alternates?.languages?.zh).toBeUndefined();
    expect(area.alternates?.languages?.["zh-Hant"]).toBe(
      "https://aniguessr.ayiora.com/zh-tw/pilgrimage",
    );
  });
});
