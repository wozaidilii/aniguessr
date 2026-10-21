import { describe, expect, it } from "vitest";
import type { OgCard } from "~/lib/og/card";
import { pilgrimageOgPath, withPilgrimageOg } from "~/lib/og/metadata";
import { locationDocumentSeo } from "~/lib/location-meta-overrides";
import { buildLocationPageSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { pilgrimagePageMetadata } from "~/lib/seo";
import { BRAND_NAME } from "~/lib/site-url";

const KAMAKURA_TITLE =
  "鎌倉 動漫聖地巡禮地圖｜灌籃高手平交道・取景景點 | AniGuessr";
const KAMAKURA_DESCRIPTION =
  "鎌倉動漫聖地巡禮：灌籃高手平交道（鎌倉高校前站）、青春豬頭少年七里濱等取景地，附座標與 Google 地圖導航。";
const FUJISAWA_TITLE =
  "江之島 動漫聖地巡禮地圖｜青春豬頭少年・孤獨搖滾 | AniGuessr";
const FUJISAWA_DESCRIPTION =
  "江之島（藤澤市）動漫聖地巡禮：青春豬頭少年、孤獨搖滾取景地，附座標與 Google 地圖導航。";

describe("location meta overrides", () => {
  it("publishes the zh-tw Kamakura and Fujisawa copy over the template", () => {
    const kamakuraTemplate = buildLocationPageSeo("zh-tw", {
      name: "鎌倉市",
      count: 472,
    });
    const fujisawaTemplate = buildLocationPageSeo("zh-tw", {
      name: "藤澤市",
      count: 441,
    });
    expect(kamakuraTemplate.title).toBe(`鎌倉市 動畫取景地 | ${BRAND_NAME}`);
    expect(fujisawaTemplate.title).toBe(`藤澤市 動畫取景地 | ${BRAND_NAME}`);

    const kamakura = locationDocumentSeo(
      "zh-tw",
      "kamakura-kanagawa",
      kamakuraTemplate,
    );
    const fujisawa = locationDocumentSeo(
      "zh-tw",
      "fujisawa-kanagawa",
      fujisawaTemplate,
    );
    expect(kamakura).toEqual({
      title: KAMAKURA_TITLE,
      description: KAMAKURA_DESCRIPTION,
    });
    expect(fujisawa).toEqual({
      title: FUJISAWA_TITLE,
      description: FUJISAWA_DESCRIPTION,
    });

    for (const [slug, seo] of [
      ["kamakura-kanagawa", kamakura],
      ["fujisawa-kanagawa", fujisawa],
    ] as const) {
      const metadata = pilgrimagePageMetadata(
        "zh-tw",
        `/pilgrimage/locations/${slug}`,
        seo.title,
        seo.description,
        true,
      );
      expect(metadata.title).toEqual({ absolute: seo.title });
      expect(metadata.description).toBe(seo.description);
      expect(metadata.openGraph?.title).toBe(seo.title);
      expect(metadata.openGraph?.description).toBe(seo.description);
      expect(metadata.twitter).toMatchObject({
        title: seo.title,
        description: seo.description,
      });

      const card = { version: "card-v", alt: "template card" } as OgCard;
      const withImage = withPilgrimageOg(
        metadata,
        "zh-tw",
        "locations",
        slug,
        card,
      );
      const imagePath = pilgrimageOgPath("zh-tw", "locations", slug, "card-v");
      expect(withImage.openGraph?.title).toBe(seo.title);
      expect(withImage.openGraph?.description).toBe(seo.description);
      expect(withImage.openGraph?.images).toEqual([
        {
          url: `https://aniguessr.ayiora.com${imagePath}`,
          width: 1200,
          height: 630,
          alt: "template card",
        },
      ]);
      expect(withImage.twitter).toMatchObject({
        title: seo.title,
        description: seo.description,
        card: "summary_large_image",
        images: [`https://aniguessr.ayiora.com${imagePath}`],
      });
    }
  });

  it("leaves the visible location heading on the page template", () => {
    const copy = getPilgrimageCopy("zh-tw");
    expect(copy.spotsInLocation("鎌倉市", 472)).toBe("鎌倉市 動畫取景 · 472 處");
    expect(copy.spotsInLocation("藤澤市", 441)).toBe("藤澤市 動畫取景 · 441 處");
    expect(copy.spotsInLocation("鎌倉市", 472)).not.toBe(KAMAKURA_TITLE);
    expect(copy.spotsInLocation("藤澤市", 441)).not.toBe(FUJISAWA_TITLE);
  });

  it("keeps other locales and slugs on the generated metadata", () => {
    const generated = {
      title: "Generated title",
      description: "Generated description",
    };
    expect(
      locationDocumentSeo("en", "kamakura-kanagawa", generated),
    ).toEqual(generated);
    expect(
      locationDocumentSeo("ja", "fujisawa-kanagawa", {
        title: "Template",
        description: "Template description",
      }).title,
    ).toBe(`江の島 / Enoshima 実在ロケ地 | ${BRAND_NAME}`);
    expect(
      locationDocumentSeo("zh-tw", "tokyo-tokyo", generated),
    ).toEqual(generated);
  });
});
