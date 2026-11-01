import { describe, expect, it } from "vitest";
import { pilgrimagePageMetadata } from "~/lib/seo";

describe("pilgrimagePageMetadata index shrink", () => {
  it("sets robots and googleBot to noindex when not indexable", () => {
    const metadata = pilgrimagePageMetadata(
      "ja",
      "/pilgrimage/spots/anitabi_test",
      "Title",
      "Description",
      false,
      { indexable: false },
    );
    expect(metadata.robots).toEqual({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
    expect(metadata.alternates?.languages).toBeUndefined();
    expect(metadata.alternates?.canonical).toBeDefined();
  });

  it("omits simplified Chinese hreflang for tier-A spots", () => {
    const metadata = pilgrimagePageMetadata(
      "ja",
      "/pilgrimage/spots/anitabi_test",
      "Title",
      "Description",
      true,
      { indexable: true, includeZh: false },
    );
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(languages["zh-Hans"]).toBeUndefined();
    expect(languages["zh-CN"]).toBeUndefined();
    expect(languages["zh-SG"]).toBeUndefined();
    expect(languages["zh-Hant"]).toBeDefined();
  });
});
