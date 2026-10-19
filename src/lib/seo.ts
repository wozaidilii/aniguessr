import { type Metadata } from "next";
import {
  ANIME_LOCALES,
  DEFAULT_ANIME_LOCALE,
  stripLocalePrefix,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import { resolveSiteUrl } from "~/lib/site-url";

/** Canonical origin from NEXT_PUBLIC_SITE_URL, otherwise the production default. */
export const SITE_URL: string = resolveSiteUrl();

export const SITE_NAME = "AniGuessr";

export const SITE_DESCRIPTIONS: Record<AnimeLocale, string> = {
  en: "AniGuessr is an anime street-view guessing game: read the anime clue, interrogate the real Street View, and pin the pilgrimage location on the world map.",
  zh: "AniGuessr 是一款动漫街景猜地点游戏：读取番剧线索，在真实街景中寻找答案，把圣地坐标钉回世界地图。",
  ja: "AniGuessr はアニメの手がかりから現実のストリートビューで場所を当てる聖地巡礼ゲームです。",
};

/** 把站内相对路径拼成绝对 URL。 */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${suffix === "/" ? "" : suffix}` || SITE_URL;
}

/** 为指定裸路径生成 /{locale}/... 形式的 hreflang 映射。 */
export function localeAlternates(path = "/"): Record<string, string> {
  const barePath = stripLocalePrefix(path);
  const entries = ANIME_LOCALES.map((locale: AnimeLocale) => {
    const localizedPath = withAnimeLocale(barePath, locale);
    return [locale, absoluteUrl(localizedPath)] as const;
  });
  return {
    ...Object.fromEntries(entries),
    "x-default": absoluteUrl(withAnimeLocale(barePath, DEFAULT_ANIME_LOCALE)),
  };
}

/** Locale canonical + hreflang, with an absolute title so the root template is not appended. */
export function localizedPageMetadata(
  locale: AnimeLocale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const canonical = withAnimeLocale(path, locale);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: localeAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}
