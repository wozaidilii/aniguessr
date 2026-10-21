import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

/**
 * Fixed OG card copy. Marketing and SEO edit this file only.
 * Do not add a company legal name, address, or a sample-data badge.
 */
export type OgLocale = "ja" | "zh" | "zh-tw" | "en";

export const OG_TEMPLATE_VERSION = "1";

export const OG_CHROME = {
  logo: "ANIGUESSR",
  by: "by",
  brand: "Ayiora",
  domain: "aniguessr.ayiora.com",
  copyright: "© 2026 Ayiora",
} as const;

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export interface OgCopy {
  chipSpot: string;
  chipWork: string;
  chipArea: string;
  /** Work page stat, with the count already formatted. */
  spotCount: (count: number) => { strong: string; rest: string };
  /** Area page stat. Both counts are strong. */
  areaStat: (
    works: number,
    spots: number,
  ) => { works: string; between: string; spots: string; after: string };
  /** Spot page suffix. Spaces are intentional and must stay inside one token. */
  moreWorks: (count: number) => string;
  altSpot: (spot: string, work: string) => string;
  altWork: (work: string, count: number) => string;
  altArea: (area: string) => string;
}

export const OG_COPY: Record<OgLocale, OgCopy> = {
  ja: {
    chipSpot: "聖地巡礼スポット",
    chipWork: "アニメの聖地",
    chipArea: "聖地巡礼エリア",
    spotCount: (count) => ({
      strong: formatCount(count),
      rest: " か所の聖地",
    }),
    areaStat: (works, spots) => ({
      works: formatCount(works),
      between: " 作品・",
      spots: formatCount(spots),
      after: " か所",
    }),
    moreWorks: (count) => `ほか ${formatCount(count)} 作品`,
    altSpot: (spot, work) => `${spot}（${work}）の聖地の地図`,
    altWork: (work, count) => `${work}の聖地 ${formatCount(count)} か所の地図`,
    altArea: (area) => `${area}のアニメ聖地巡礼マップ`,
  },
  zh: {
    chipSpot: "圣地巡礼地点",
    chipWork: "动漫圣地",
    chipArea: "圣地巡礼地区",
    spotCount: (count) => ({
      strong: formatCount(count),
      rest: " 处圣地",
    }),
    areaStat: (works, spots) => ({
      works: formatCount(works),
      between: " 部作品・",
      spots: formatCount(spots),
      after: " 处圣地",
    }),
    moreWorks: (count) => `另有 ${formatCount(count)} 部作品`,
    altSpot: (spot, work) => `${spot}（${work}）圣地地图`,
    altWork: (work, count) => `${work}的 ${formatCount(count)} 处圣地地图`,
    altArea: (area) => `${area}动漫圣地巡礼地图`,
  },
  "zh-tw": {
    chipSpot: "聖地巡禮地點",
    chipWork: "動漫聖地",
    chipArea: "聖地巡禮地區",
    spotCount: (count) => ({
      strong: formatCount(count),
      rest: " 處聖地",
    }),
    areaStat: (works, spots) => ({
      works: formatCount(works),
      between: " 部作品・",
      spots: formatCount(spots),
      after: " 處聖地",
    }),
    moreWorks: (count) => `另有 ${formatCount(count)} 部作品`,
    altSpot: (spot, work) => `${spot}（${work}）聖地地圖`,
    altWork: (work, count) => `${work}的 ${formatCount(count)} 處聖地地圖`,
    altArea: (area) => `${area}動漫聖地巡禮地圖`,
  },
  en: {
    chipSpot: "ANIME PILGRIMAGE SPOT",
    chipWork: "REAL-LIFE LOCATIONS",
    chipArea: "ANIME PILGRIMAGE AREA",
    spotCount: (count) => ({
      strong: formatCount(count),
      rest: count === 1 ? " real-life location" : " real-life locations",
    }),
    areaStat: (works, spots) => ({
      works: formatCount(works),
      between: " series · ",
      spots: formatCount(spots),
      after: spots === 1 ? " location" : " locations",
    }),
    moreWorks: (count) => `+${formatCount(count)} more series`,
    altSpot: (spot, work) => `Map of ${spot}, a real-life location from ${work}`,
    altWork: (work, count) =>
      count === 1
        ? `Map of 1 real-life location from ${work}`
        : `Map of ${formatCount(count)} real-life locations from ${work}`,
    altArea: (area) => `Anime pilgrimage map of ${area}`,
  },
};

export function ogCopy(locale: OgLocale): OgCopy {
  return OG_COPY[locale];
}

/** zh-tw → zh → ja. Every other locale falls back to ja. */
export function ogLocaleChain(requested: PilgrimageLocale): OgLocale[] {
  if (requested === "zh-tw") return ["zh-tw", "zh", "ja"];
  if (requested === "ja") return ["ja"];
  return [requested, "ja"];
}
