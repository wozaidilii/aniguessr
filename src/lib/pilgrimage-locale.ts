import {
  isAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";

/** Pilgrimage-only locale. Not part of ANIME_LOCALES, so the rest of the site does not advertise it. */
export const ZH_TW_LOCALE = "zh-tw" as const;

export type PilgrimageLocale = AnimeLocale | typeof ZH_TW_LOCALE;

export function isZhTwLocale(value: unknown): value is typeof ZH_TW_LOCALE {
  return value === ZH_TW_LOCALE;
}

export function isPilgrimageLocale(value: unknown): value is PilgrimageLocale {
  return isZhTwLocale(value) || isAnimeLocale(value);
}

/** Every pilgrimage location has a zh-TW page. Non-pilgrimage routes stay off this locale. */
export function isZhTwCoveredLocationSlug(_slug: string): boolean {
  return true;
}

/** Site chrome (home, game) stays on zh/ja/en. zh-TW covers pilgrimage pages only. */
export function pilgrimageSiteLocale(locale: PilgrimageLocale): AnimeLocale {
  return locale === ZH_TW_LOCALE ? "zh" : locale;
}

export function htmlLangForPilgrimage(locale: PilgrimageLocale): string {
  return locale === ZH_TW_LOCALE ? "zh-Hant" : locale;
}

/**
 * Split /zh-tw before zh/ja/en. parseLocaleFromPathname does not know zh-tw,
 * and treating it as an unprefixed path would redirect to /en/zh-tw/...
 */
export function splitLocalePath(pathname: string): {
  locale: PilgrimageLocale | null;
  pathname: string;
} {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = normalized.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isPilgrimageLocale(first)) {
    const rest = segments.slice(1);
    return {
      locale: first,
      pathname: rest.length > 0 ? `/${rest.join("/")}` : "/",
    };
  }
  return { locale: null, pathname: normalized || "/" };
}

/** Prefix a bare path with /{locale}, including zh-tw. Drops a previous locale prefix. */
export function withPilgrimageLocale(
  path: string,
  locale: PilgrimageLocale,
): string {
  const url = new URL(path, "https://aniguessr.local");
  const innerPath = splitLocalePath(url.pathname).pathname;
  url.pathname = innerPath === "/" ? `/${locale}` : `/${locale}${innerPath}`;
  url.searchParams.delete("lang");
  return `${url.pathname}${url.search}${url.hash}`;
}
