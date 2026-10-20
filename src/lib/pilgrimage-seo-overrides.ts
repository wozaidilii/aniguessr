import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { type RenderedSeo } from "~/lib/pilgrimage-seo-meta";
import { BRAND_NAME } from "~/lib/site-url";

export interface SeoOverride {
  title?: string;
  description?: string;
}

/**
 * Optional metadata overrides keyed by the public slug.
 * Anime slugs stay `{subjectId}-{suffix}` (`/pilgrimage/anime/{slug}`).
 * Location slugs are `{city}-{prefecture}` from the geocoder.
 * Spot keys are spot ids.
 * Leave en, ja, or zh blank to keep the generated template.
 * zh-TW document titles and descriptions come only from this map.
 * A missing or blank zh-TW entry stays empty until copy is supplied.
 */
export const PILGRIMAGE_SEO_OVERRIDES: {
  anime: Record<string, Partial<Record<PilgrimageLocale, SeoOverride>>>;
  location: Record<string, Partial<Record<PilgrimageLocale, SeoOverride>>>;
  spot: Record<string, Partial<Record<PilgrimageLocale, SeoOverride>>>;
} = {
  anime: {},
  location: {
    // Admin area is Fujisawa; the title can still lead with the island name.
    "fujisawa-kanagawa": {
      en: {
        title: `Enoshima / 江の島 Real Life Locations | ${BRAND_NAME}`,
        description:
          "Real life locations on Enoshima (江の島) in Fujisawa, Kanagawa, with coordinates and scene notes.",
      },
      ja: {
        title: `江の島 / Enoshima 実在ロケ地 | ${BRAND_NAME}`,
        description:
          "神奈川県藤沢市・江の島の実在ロケ地。座標とシーン情報つき。",
      },
      zh: {
        title: `江之岛 / 江の島 现实取景地 | ${BRAND_NAME}`,
        description: "神奈川县藤泽市江之岛一带的现实取景地，含坐标与场景信息。",
      },
    },
  },
  spot: {},
};

export function applyPilgrimageSeoOverride(
  kind: "anime" | "location" | "spot",
  slug: string,
  locale: PilgrimageLocale,
  seo: RenderedSeo,
): RenderedSeo {
  const entry = PILGRIMAGE_SEO_OVERRIDES[kind][slug]?.[locale];
  if (locale === "zh-tw") {
    return {
      title: nonempty(entry?.title) ?? "",
      description: nonempty(entry?.description) ?? "",
    };
  }
  if (!entry) return seo;
  return {
    title: nonempty(entry.title) ?? seo.title,
    description: nonempty(entry.description) ?? seo.description,
  };
}

function nonempty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}
