import { type GameLocale } from "~/lib/game-locale";
import { type GoogleMapsLanguage } from "~/lib/google-street-view";

export function getGoogleMapsLanguage(locale: GameLocale): GoogleMapsLanguage {
  if (locale === "zh") return "zh-CN";
  if (locale === "zh-tw") return "zh-TW";
  if (locale === "ja") return "ja";
  return "en";
}
