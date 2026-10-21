import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { OgCard } from "~/lib/og/card";
import { withPilgrimageOg } from "~/lib/og/metadata";
import { jaSpotPlaceOverride } from "~/lib/ja-place-overrides";
import {
  pickLocalizedText,
  pickMaybeLocalizedText,
  pickSpotPlaceFromRecord,
} from "~/lib/localized-text";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  buildAnimeIndexSeo,
  buildAnimePageSeo,
  buildLocationIndexSeo,
  buildLocationPageSeo,
  buildPilgrimageHubSeo,
  buildSpotSeo,
  type SpotSeoFields,
} from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { pilgrimagePageMetadata } from "~/lib/seo";
import { BRAND_NAME } from "~/lib/site-url";
import {
  animeTitleIsAmbiguous,
  getPilgrimageSeoIndex,
  getSpotSeoVariant,
  type PilgrimageAnimeSummary,
  type PilgrimageLocationSummary,
  type PilgrimageSpot,
} from "~/server/data/pilgrimage-seo";
import type { RenderedSeo } from "~/lib/pilgrimage-seo-meta";

/** Layout fallback used when a pilgrimage document title is blank. */
const DEFAULT_SITE_TITLE = `${BRAND_NAME} | Anime Street-View Guessing Game`;

const INDEX_PATH = path.join(process.cwd(), "public/data/seo/index.json");

function assertPublished(pagePath: string, title: string, description: string) {
  expect(title.trim().length).toBeGreaterThan(0);
  expect(description.trim().length).toBeGreaterThan(0);
  expect(title).not.toBe(DEFAULT_SITE_TITLE);
  expect(title.includes("Anime Street-View Guessing Game")).toBe(false);

  const metadata = pilgrimagePageMetadata(
    "zh-tw",
    pagePath,
    title,
    description,
    true,
  );
  expect(metadata.title).toEqual({ absolute: title });
  expect(metadata.description).toBe(description);
  expect(metadata.openGraph?.title).toBe(title);
  expect(metadata.openGraph?.description).toBe(description);
  expect(metadata.twitter).toMatchObject({ title, description });
  expect(metadata.alternates?.canonical).toBe(
    withPilgrimageLocale(pagePath, "zh-tw"),
  );
  const languages = metadata.alternates?.languages ?? {};
  const zhTwUrl = `https://aniguessr.ayiora.com${withPilgrimageLocale(pagePath, "zh-tw")}`;
  expect(languages["zh-Hant"]).toBe(zhTwUrl);
  expect(languages["zh-TW"]).toBe(zhTwUrl);

  const withImage = withPilgrimageOg(
    metadata,
    "zh-tw",
    "locations",
    "kamakura-kanagawa",
    { version: "test", alt: title } as OgCard,
  );
  expect(withImage.twitter).toMatchObject({
    title,
    description,
    card: "summary_large_image",
  });
  expect(withImage.openGraph?.title).toBe(title);
  expect(withImage.openGraph?.description).toBe(description);
  expect(withImage.alternates?.canonical).toBe(metadata.alternates?.canonical);
}

function locationSeo(location: PilgrimageLocationSummary): RenderedSeo {
  return applyPilgrimageSeoOverride(
    "location",
    location.slug,
    "zh-tw",
    buildLocationPageSeo("zh-tw", {
      name: pickLocalizedText(location.name, "zh-tw"),
      count: location.spotCount,
    }),
  );
}

function animeSeo(anime: PilgrimageAnimeSummary): RenderedSeo {
  const title = pickLocalizedText(anime.animeTitle, "zh-tw");
  return applyPilgrimageSeoOverride(
    "anime",
    anime.slug,
    "zh-tw",
    buildAnimePageSeo(
      "zh-tw",
      { id: anime.subjectId, title, count: anime.spotCount },
      animeTitleIsAmbiguous(title),
    ),
  );
}

function spotFields(spot: PilgrimageSpot): SpotSeoFields {
  return {
    id: spot.id,
    anime: pickLocalizedText(spot.animeTitle, "zh-tw"),
    place: pickSpotPlaceFromRecord(
      spot.answerName,
      spot.title,
      "zh-tw",
      jaSpotPlaceOverride(spot.id),
    ),
    area: pickLocalizedText(spot.location, "zh-tw"),
    episode: pickMaybeLocalizedText(spot.episodeContext, "zh-tw"),
    scene: pickLocalizedText(spot.title, "zh-tw"),
  };
}

function spotSeo(spot: PilgrimageSpot): RenderedSeo {
  const fields = spotFields(spot);
  return applyPilgrimageSeoOverride(
    "spot",
    spot.id,
    "zh-tw",
    buildSpotSeo("zh-tw", fields, getSpotSeoVariant(spot, "zh-tw")),
  );
}

describe("zh-tw pilgrimage document metadata", () => {
  it("mirrors the zh templates in Traditional wording", () => {
    expect(
      buildLocationPageSeo("zh-tw", { name: "鎌倉市", count: 472 }),
    ).toEqual({
      title: `鎌倉市 動畫取景地 | ${BRAND_NAME}`,
      description: "鎌倉市 的動畫取景地共 472 處。",
    });
    expect(
      applyPilgrimageSeoOverride(
        "location",
        "fujisawa-kanagawa",
        "zh-tw",
        buildLocationPageSeo("zh-tw", { name: "藤澤市", count: 441 }),
      ),
    ).toEqual({
      title: `江之島 / 江の島 動畫取景地 | ${BRAND_NAME}`,
      description: "神奈川縣藤澤市江之島一帶的現實取景地，含座標與場景資訊。",
    });
    expect(
      buildAnimePageSeo(
        "zh-tw",
        { id: "294993", title: "咒術迴戰", count: 133 },
        false,
      ),
    ).toEqual({
      title: `咒術迴戰 取景地 | ${BRAND_NAME}`,
      description: "咒術迴戰 的現實取景地共 133 處，含座標與場景資訊。",
    });
    expect(
      buildSpotSeo(
        "zh-tw",
        {
          id: "spot",
          anime: "四月是你的謊言",
          place: "稲村ヶ崎",
          area: "鎌倉市",
          episode: "",
          scene: "",
        },
        "base",
      ),
    ).toEqual({
      title: `四月是你的謊言 稲村ヶ崎 取景地 | ${BRAND_NAME}`,
      description: "四月是你的謊言 在鎌倉市的取景地「稲村ヶ崎」。",
    });
    expect(
      buildPilgrimageHubSeo("zh-tw", {
        spotCount: 1,
        animeCount: 2,
        locationCount: 3,
      }),
    ).toEqual({
      title: `動畫取景地與聖地巡禮 | ${BRAND_NAME}`,
      description: "收錄 2 部作品、3 個地區、共 1 處動畫取景地。",
    });
    expect(buildAnimeIndexSeo("zh-tw", { animeCount: 2 })).toEqual({
      title: `按作品瀏覽動畫取景地 | ${BRAND_NAME}`,
      description: "已收錄取景地的動畫作品共 2 部。",
    });
    expect(buildLocationIndexSeo("zh-tw", { locationCount: 3 })).toEqual({
      title: `按地區瀏覽動畫取景地 | ${BRAND_NAME}`,
      description: "已收錄動畫取景地的地區共 3 個。",
    });
  });

  it("publishes description, Open Graph, and Twitter without changing canonical", () => {
    assertPublished(
      "/pilgrimage/locations/kamakura-kanagawa",
      `鎌倉市 動畫取景地 | ${BRAND_NAME}`,
      "鎌倉市 的動畫取景地共 472 處。",
    );
    assertPublished(
      "/pilgrimage/locations/fujisawa-kanagawa",
      `江之島 / 江の島 動畫取景地 | ${BRAND_NAME}`,
      "神奈川縣藤澤市江之島一帶的現實取景地，含座標與場景資訊。",
    );
  });

  it.skipIf(!existsSync(INDEX_PATH))(
    "gives every indexed zh-tw pilgrimage page its own title",
    () => {
      const index = getPilgrimageSeoIndex();
      expect(index).not.toBeNull();
      if (!index) return;

      const misses: string[] = [];
      const check = (label: string, seo: RenderedSeo) => {
        if (
          !seo.title.trim() ||
          !seo.description.trim() ||
          seo.title === DEFAULT_SITE_TITLE ||
          seo.title.includes("Anime Street-View Guessing Game")
        ) {
          misses.push(`${label} => ${seo.title}`);
        }
      };

      check(
        "hub",
        buildPilgrimageHubSeo("zh-tw", {
          spotCount: index.spotCount,
          animeCount: index.animeCount,
          locationCount: index.locationCount,
        }),
      );
      check(
        "anime-index",
        buildAnimeIndexSeo("zh-tw", { animeCount: index.animeCount }),
      );
      check(
        "location-index",
        buildLocationIndexSeo("zh-tw", {
          locationCount: index.locationCount,
        }),
      );

      const kamakura = index.locations.find(
        (item) => item.slug === "kamakura-kanagawa",
      );
      const fujisawa = index.locations.find(
        (item) => item.slug === "fujisawa-kanagawa",
      );
      const work = index.animes.find((item) => item.subjectId === "294993");
      const spot = index.spots.anitabi_100444_51i51yooo;
      expect(kamakura?.name.tw).toBe("鎌倉市");
      expect(fujisawa).toBeTruthy();
      expect(work?.animeTitle.tw).toBe("咒術迴戰");
      expect(spot?.animeTitle.tw).toBe("四月是你的謊言");

      const kamakuraSeo = locationSeo(kamakura!);
      const fujisawaSeo = locationSeo(fujisawa!);
      const workSeo = animeSeo(work!);
      const spotDocument = spotSeo(spot!);
      expect(kamakuraSeo).toEqual({
        title: `鎌倉市 動畫取景地 | ${BRAND_NAME}`,
        description: `鎌倉市 的動畫取景地共 ${kamakura!.spotCount} 處。`,
      });
      expect(fujisawaSeo).toEqual({
        title: `江之島 / 江の島 動畫取景地 | ${BRAND_NAME}`,
        description: "神奈川縣藤澤市江之島一帶的現實取景地，含座標與場景資訊。",
      });
      expect(animeTitleIsAmbiguous("咒術迴戰")).toBe(false);
      expect(workSeo).toEqual({
        title: `咒術迴戰 取景地 | ${BRAND_NAME}`,
        description: `咒術迴戰 的現實取景地共 ${work!.spotCount} 處，含座標與場景資訊。`,
      });
      expect(spotDocument.title).toBe(
        `四月是你的謊言 稲村ヶ崎 取景地 | ${BRAND_NAME}`,
      );
      expect(spotDocument.description).toBe(
        "四月是你的謊言 在鎌倉市的取景地「稲村ヶ崎」。",
      );

      for (const location of index.locations)
        check(location.slug, locationSeo(location));
      for (const anime of index.animes) check(anime.slug, animeSeo(anime));
      let spotPages = 0;
      for (const id of index.spotIds) {
        const item = index.spots[id];
        if (!item || item.redirectTo) continue;
        check(id, spotSeo(item));
        spotPages += 1;
      }

      expect(misses.slice(0, 20)).toEqual([]);
      expect(index.locations.length).toBeGreaterThan(100);
      expect(index.animes.length).toBeGreaterThan(100);
      expect(spotPages).toBeGreaterThan(1000);
    },
    120_000,
  );
});
