import type { AnimeLocale } from "~/lib/anime-locale";

export const HOME_LOCALES = ["ja", "zh", "en", "zh-tw"] as const;
export type HomeLocale = (typeof HOME_LOCALES)[number];

export function isHomeLocale(value: string): value is HomeLocale {
  return (HOME_LOCALES as readonly string[]).includes(value);
}

/** Game, login, and battle stay on zh/ja/en. zh-TW is a homepage and pilgrimage locale. */
export function homeSiteLocale(locale: HomeLocale): AnimeLocale {
  return locale === "zh-tw" ? "zh" : locale;
}
