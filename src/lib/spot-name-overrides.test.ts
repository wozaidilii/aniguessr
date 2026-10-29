import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildSpotCard } from "~/lib/og/card";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  pickLocalizedText,
  pickMaybeLocalizedText,
} from "~/lib/localized-text";
import { localizedSpotName } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { buildSpotSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { absoluteUrl, pilgrimagePageMetadata } from "~/lib/seo";
import {
  applySpotDisplayName,
  clearOverriddenSpotAliases,
  spotDisplayNameOverride,
  spotPlaceName,
  withSpotDisplayNames,
  type LocaleNameSet,
} from "~/lib/spot-name-overrides";
import { buildTouristAttractionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import { loadSpotOg } from "~/server/og/load";
import { getSpotById, getSpotSeoVariant } from "~/server/data/pilgrimage-seo";

const SPOT_ID = "anitabi_101399_51i525idi";
const INDEX_PATH = path.join(process.cwd(), "public/data/seo/index.json");

const NAMES = {
  ja: "竹下通り入口（原宿）",
  zh: "竹下通入口（原宿）",
  "zh-tw": "竹下通入口（原宿）",
  en: "Takeshita Street entrance (Harajuku)",
} as const;

const TITLES = {
  ja: "アイドルマスター シンデレラガールズ 聖地：竹下通り入口（原宿）| AniGuessr",
  zh: "偶像大师 灰姑娘女孩 圣地：竹下通入口（原宿）| AniGuessr",
  "zh-tw": "偶像大師 灰姑娘女孩 聖地：竹下通入口（原宿）| AniGuessr",
  en: "Takeshita Street entrance (Harajuku) — The Idolmaster Cinderella Girls Real-Life Location | AniGuessr",
} as const;

const DESCRIPTIONS = {
  ja: "『アイドルマスター シンデレラガールズ』第3話に登場する竹下通り入口（原宿）。東京都渋谷区。ストリートビューで下見して、Googleマップでナビできます。",
  zh: "《偶像大师 灰姑娘女孩》第3集取景地「竹下通入口（原宿）」，位于东京都涩谷区。可以在街景里预览，并用 Google 地图导航。",
  "zh-tw":
    "《偶像大師 灰姑娘女孩》第3集取景地「竹下通入口（原宿）」，位於東京都澀谷區。可以在街景裡預覽，並用 Google 地圖導航。",
  en: "Takeshita Street entrance (Harajuku) appears in The Idolmaster Cinderella Girls, Episode 3. Preview it on Street View and get directions in Google Maps.",
} as const;

const H1 = {
  ja: "アイドルマスター シンデレラガールズ 聖地：竹下通り入口（原宿）",
  zh: "偶像大师 灰姑娘女孩 圣地：竹下通入口（原宿）",
  "zh-tw": "偶像大師 灰姑娘女孩 聖地：竹下通入口（原宿）",
  en: "The Idolmaster Cinderella Girls pilgrimage: Takeshita Street entrance (Harajuku)",
} as const;

const LOCALES = [
  "ja",
  "zh",
  "zh-tw",
  "en",
] as const satisfies readonly PilgrimageLocale[];

const takeshita = {
  id: SPOT_ID,
  subjectId: "101399",
  subjectSlug: "101399-偶像大师-灰姑娘女孩",
  locationSlug: "shibuya-tokyo",
  lat: 35.671,
  lng: 139.703,
  year: null,
  difficulty: null,
  confidence: "high" as const,
  imagePath: null,
  sourceUrl: null,
  redirectTo: null,
  title: {
    zh: "竹下口拱门与商店街入口",
    ja: "竹下口アーチと商店街入口",
    en: "Takeshita exit arch",
    tw: "竹下口拱門與商店街入口",
  },
  description: {
    zh: "场景说明",
    ja: "シーン説明",
    en: "Scene note",
    tw: "場景說明",
  },
  animeTitle: {
    zh: "偶像大师 灰姑娘女孩",
    ja: "アイドルマスター シンデレラガールズ",
    en: "The Idolmaster Cinderella Girls",
    tw: "偶像大師 灰姑娘女孩",
  },
  location: {
    zh: "东京都涩谷区",
    ja: "東京都渋谷区",
    en: "Shibuya, Tokyo",
    tw: "東京都澀谷區",
  },
  answerName: {
    zh: "竹下口（原宿）",
    ja: "",
    en: "Takeshita Exit (Harajuku)",
    tw: "竹下口（原宿）",
  },
  aspect: null,
  episodeContext: {
    zh: "第3话，角色外出购物场景",
    ja: "第3話、キャラクターの買い物シーン",
    en: "Episode 3, character shopping scene",
    tw: "第3話，角色外出購物場景",
  },
  funfact: [],
};

function cardNames(): LocaleNameSet {
  return {
    ja: "",
    zh: "竹下口（原宿）",
    "zh-tw": "竹下口（原宿）",
    en: "Takeshita Exit (Harajuku)",
  };
}

describe("spot display-name overrides", () => {
  it("replaces zh, zh-tw, and en, and leaves ja on the existing label", () => {
    expect(spotDisplayNameOverride("zh", SPOT_ID)).toBe(NAMES.zh);
    expect(spotDisplayNameOverride("zh-tw", SPOT_ID)).toBe(NAMES["zh-tw"]);
    expect(spotDisplayNameOverride("en", SPOT_ID)).toBe(NAMES.en);
    expect(spotDisplayNameOverride("ja", SPOT_ID)).toBeUndefined();
    expect(spotDisplayNameOverride("zh", "anitabi_other")).toBeUndefined();
    expect(applySpotDisplayName("zh", "anitabi_other", "入口")).toBe("入口");

    for (const locale of LOCALES) {
      expect(spotPlaceName(takeshita, locale)).toBe(NAMES[locale]);
      expect(toFilmingLocation(takeshita, locale).name).toBe(NAMES[locale]);
      expect(
        buildTouristAttractionJsonLd(toFilmingLocation(takeshita, locale)).name,
      ).toBe(NAMES[locale]);
      expect(
        getPilgrimageCopy(locale).seoSpotTitle(
          takeshita.animeTitle[locale === "zh-tw" ? "tw" : locale],
          NAMES[locale],
        ),
      ).toBe(H1[locale]);
    }

    const nav = {
      id: SPOT_ID,
      name: {
        zh: "竹下口（原宿）",
        ja: "",
        en: "Takeshita Exit (Harajuku)",
        tw: "竹下口（原宿）",
      },
    };
    expect(localizedSpotName(nav, "zh")).toBe(NAMES.zh);
    expect(localizedSpotName(nav, "zh-tw")).toBe(NAMES["zh-tw"]);
    expect(localizedSpotName(nav, "en")).toBe(NAMES.en);
    expect(localizedSpotName(nav, "ja")).toBe("竹下口（原宿）");
    expect(
      localizedSpotName({ id: "anitabi_other", name: nav.name }, "zh"),
    ).toBe("竹下口（原宿）");
  });

  it("puts the override in the title, description, and share-card text", () => {
    const episodes = {
      ja: "第3話、キャラクターの買い物シーン",
      zh: "第3话，角色外出购物场景",
      "zh-tw": "第3話，角色外出購物場景",
      en: "Episode 3, character shopping scene",
    } as const;
    const areas = {
      ja: "東京都渋谷区",
      zh: "东京都涩谷区",
      "zh-tw": "東京都澀谷區",
      en: "Shibuya, Tokyo",
    } as const;

    for (const locale of LOCALES) {
      const seo = buildSpotSeo(
        locale,
        {
          id: SPOT_ID,
          anime: takeshita.animeTitle[locale === "zh-tw" ? "tw" : locale],
          place: NAMES[locale],
          area: areas[locale],
          episode: episodes[locale],
          scene: takeshita.title[locale === "zh-tw" ? "tw" : locale],
        },
        "base",
      );
      expect(seo.title).toBe(TITLES[locale]);
      expect(seo.description).toBe(DESCRIPTIONS[locale]);

      const path = `/pilgrimage/spots/${SPOT_ID}`;
      const metadata = pilgrimagePageMetadata(
        locale,
        path,
        seo.title,
        seo.description,
        true,
      );
      expect(metadata.title).toEqual({ absolute: TITLES[locale] });
      expect(metadata.description).toBe(DESCRIPTIONS[locale]);
      expect(metadata.openGraph?.title).toBe(TITLES[locale]);
      expect(metadata.openGraph?.description).toBe(DESCRIPTIONS[locale]);
      expect(metadata.twitter).toMatchObject({
        title: TITLES[locale],
        description: DESCRIPTIONS[locale],
      });
      expect(metadata.alternates?.canonical).toBe(`/${locale}${path}`);
      const languages = metadata.alternates?.languages ?? {};
      expect(languages["zh-Hans"]).toBe(absoluteUrl(`/zh${path}`));
      expect(languages["zh-CN"]).toBe(languages["zh-Hans"]);
      expect(languages.ja).toBe(absoluteUrl(`/ja${path}`));
      expect(languages.en).toBe(absoluteUrl(`/en${path}`));
      expect(languages["x-default"]).toBe(absoluteUrl(`/en${path}`));
      expect(languages["zh-Hant"]).toBe(absoluteUrl(`/zh-tw${path}`));
      expect(languages["zh-TW"]).toBe(absoluteUrl(`/zh-tw${path}`));
    }

    const stamped = withSpotDisplayNames(cardNames(), SPOT_ID);
    expect(stamped.ja).toBe("");
    const aliases = clearOverriddenSpotAliases(
      { ja: "", zh: "旧名", "zh-tw": "舊名", en: "Old name" },
      SPOT_ID,
    );
    expect(aliases).toEqual({ ja: "", zh: "", "zh-tw": "", en: "" });

    for (const locale of ["zh", "zh-tw", "en"] as const) {
      const card = buildSpotCard({
        requestedLocale: locale,
        spotName: stamped,
        ogTitle: aliases,
        workTitle: {
          ja: takeshita.animeTitle.ja,
          zh: takeshita.animeTitle.zh,
          "zh-tw": takeshita.animeTitle.tw,
          en: takeshita.animeTitle.en,
        },
        areaName: {
          ja: areas.ja,
          zh: areas.zh,
          "zh-tw": areas["zh-tw"],
          en: areas.en,
        },
        otherWorkCount: 0,
        art: "city",
        origin: { lat: 35.67, lng: 139.7 },
        nearby: [],
        derivedJa: takeshita.title.ja,
        titleZh: takeshita.title.zh,
        placeOverride: "竹下通り入口（原宿）",
      });
      expect(card.titleLines.join("").replace(/\s+/g, "")).toContain(
        NAMES[locale].replace(/\s+/g, ""),
      );
      expect(card.alt).toContain(NAMES[locale]);
      expect(card.alt).not.toContain("竹下口（原宿）");
      expect(card.alt).not.toContain("Takeshita Exit");
    }

    const japanese = buildSpotCard({
      requestedLocale: "ja",
      spotName: stamped,
      workTitle: {
        ja: takeshita.animeTitle.ja,
        zh: takeshita.animeTitle.zh,
        "zh-tw": takeshita.animeTitle.tw,
        en: takeshita.animeTitle.en,
      },
      areaName: {
        ja: areas.ja,
        zh: areas.zh,
        "zh-tw": areas["zh-tw"],
        en: areas.en,
      },
      otherWorkCount: 0,
      art: "city",
      origin: { lat: 35.67, lng: 139.7 },
      nearby: [],
      derivedJa: takeshita.title.ja,
      titleZh: takeshita.title.zh,
      placeOverride: "竹下通り入口（原宿）",
    });
    expect(japanese.titleLines.join("")).toBe(NAMES.ja);
    expect(japanese.alt).toContain(NAMES.ja);
    expect(japanese.alt).not.toContain(NAMES.zh);
  });

  it.skipIf(!existsSync(INDEX_PATH))(
    "uses the override on the indexed Takeshita spot",
    () => {
      const spot = getSpotById(SPOT_ID);
      expect(spot).toBeTruthy();
      if (!spot) return;

      for (const locale of LOCALES) {
        const place = spotPlaceName(spot, locale);
        expect(place).toBe(NAMES[locale]);
        const seo = applyPilgrimageSeoOverride(
          "spot",
          spot.id,
          locale,
          buildSpotSeo(
            locale,
            {
              id: spot.id,
              anime: pickLocalizedText(spot.animeTitle, locale),
              place,
              area: pickLocalizedText(spot.location, locale),
              episode: pickMaybeLocalizedText(spot.episodeContext, locale),
              scene: pickLocalizedText(spot.title, locale),
            },
            getSpotSeoVariant(spot, locale),
          ),
        );
        expect(seo.title).toBe(TITLES[locale]);
        expect(seo.description).toBe(DESCRIPTIONS[locale]);
        expect(toFilmingLocation(spot, locale).name).toBe(NAMES[locale]);

        const og = loadSpotOg(locale, spot.id);
        expect(og.status).toBe("ready");
        if (og.status !== "ready") continue;
        expect(og.card.titleLines.join("").replace(/\s+/g, "")).toContain(
          NAMES[locale].replace(/\s+/g, ""),
        );
        expect(og.card.alt).toContain(NAMES[locale]);
      }
    },
    120_000,
  );
});
