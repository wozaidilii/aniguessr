import type { AnimeLocale } from "~/lib/anime-locale";

export const HOME_LOCALES = ["ja", "zh", "en", "zh-tw"] as const;
export type HomeLocale = (typeof HOME_LOCALES)[number];

export function isHomeLocale(value: string): value is HomeLocale {
  return (HOME_LOCALES as readonly string[]).includes(value);
}

/** Battle stays on zh/ja/en. Home, pilgrimage, and the anime game keep zh-tw. */
export function homeSiteLocale(locale: HomeLocale): AnimeLocale {
  return locale === "zh-tw" ? "zh" : locale;
}
