import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

export type AffiliateProvider = "rakuten_travel" | "klook";

export function affiliateProviderForLocale(
  locale: PilgrimageLocale,
): AffiliateProvider | null {
  if (locale === "ja") return "rakuten_travel";
  if (locale === "zh" || locale === "zh-tw" || locale === "en") return "klook";
  return null;
}
