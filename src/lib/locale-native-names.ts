import type { HomeLocale } from "~/lib/home-locale";

/** Full language names for the locale switcher (fixed across UI locales). */
export const LOCALE_NATIVE_NAMES: Record<HomeLocale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  "zh-tw": "繁體中文",
};

export function localeNativeName(locale: HomeLocale): string {
  return LOCALE_NATIVE_NAMES[locale];
}
