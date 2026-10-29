import type { HomeLocale } from "~/lib/home-locale";

/** BCP 47 tag for Intl region labels in the profile editor (not for routing). */
export function homeProfileUiLocale(locale: HomeLocale): string {
  if (locale === "zh-tw") return "zh-Hant-TW";
  if (locale === "zh") return "zh";
  return locale;
}
