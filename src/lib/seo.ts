import { type Metadata } from "next";
import {
  ANIME_LOCALES,
  DEFAULT_ANIME_LOCALE,
  stripLocalePrefix,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import {
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { resolveSiteUrl } from "~/lib/site-url";

/** Canonical origin from NEXT_PUBLIC_SITE_URL, otherwise the production default. */
export const SITE_URL: string = resolveSiteUrl();

export const SITE_NAME = "AniGuessr";

export const SITE_DESCRIPTIONS: Record<AnimeLocale, string> = {
  en: "AniGuessr is an anime street-view guessing game. Look at one anime frame, explore the real street, and pin the place on the map.",
  zh: "AniGuessr 是动漫街景猜地点游戏。看一张动漫画面，在真实街景里找出拍摄地，再把位置标在地图上。",
  ja: "AniGuessr は、アニメの一場面から現実の街の場所を当てるゲームです。",
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

/**
 * Pilgrimage hreflang. zh-Hant and zh-TW are added only when that URL has a
 * Traditional page. Other pilgrimage URLs keep zh/ja/en/x-default.
 */
export function pilgrimagePageMetadata(
  locale: PilgrimageLocale,
  path: string,
  title: string,
  description: string,
  includeZhTw: boolean,
): Metadata {
  const canonical = withPilgrimageLocale(path, locale);
  const languages: Record<string, string> = localeAlternates(path);
  if (includeZhTw) {
    const zhTwUrl = absoluteUrl(withPilgrimageLocale(path, "zh-tw"));
    languages["zh-Hant"] = zhTwUrl;
    languages["zh-TW"] = zhTwUrl;
  }
  const metadata: Metadata = {
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      url: canonical,
    },
  };
  if (title.trim()) {
    metadata.title = { absolute: title };
    metadata.openGraph = { ...metadata.openGraph, title };
  }
  if (description.trim()) {
    metadata.description = description;
    metadata.openGraph = { ...metadata.openGraph, description };
  }
  return metadata;
}

/**
 * A zh-TW-only document, such as the Kamakura/Enoshima index.
 * It is not an alternate of the full zh/ja/en hub.
 */
export function zhTwOnlyPageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const canonical = withPilgrimageLocale(path, "zh-tw");
  const url = absoluteUrl(canonical);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: {
        "zh-Hant": url,
        "zh-TW": url,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}
