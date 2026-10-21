import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

export interface LocalizedText {
  zh: string;
  ja: string;
  en: string;
  /** Traditional Chinese for pilgrimage records. zh-TW does not fall back to zh. */
  tw?: string;
  /**
   * Anime titles only. `ja-fallback` means `tw` is a copy of the Japanese
   * title, not an official Traditional title. Pages still display `tw`.
   * Open Graph cards treat that copy as empty.
   */
  twSource?: "official-title" | "ja-fallback";
}

export interface LocalizedLines {
  zh: string[];
  ja: string[];
  en: string[];
  tw?: string[];
}

/**
 * Locale text with a deliberate fallback order.
 * English prefers Japanese (original / romaji) over Chinese.
 * Japanese prefers English over Chinese.
 */
export function pickLocalizedText(
  text: Partial<LocalizedText> | null | undefined,
  locale: PilgrimageLocale,
): string {
  if (!text) return "";
  if (locale === "zh-tw") return text.tw?.trim() ?? "";
  const zh = text.zh?.trim() ?? "";
  const ja = text.ja?.trim() ?? "";
  const en = text.en?.trim() ?? "";
  if (locale === "zh") return zh || ja || en;
  if (locale === "ja") return ja || en || zh;
  return en || ja || zh;
}

/**
 * Spot place names. Japanese prefers the kanji stored on `zh`, then a
 * Japanese label derived from the scene title, and only then romaji.
 * Every other locale keeps `pickLocalizedText`.
 */
export function pickSpotPlaceName(
  text: Partial<LocalizedText> | null | undefined,
  locale: PilgrimageLocale,
  derivedJa?: string,
): string {
  if (locale !== "ja") return pickLocalizedText(text, locale);
  const ja = text?.ja?.trim() ?? "";
  const zh = text?.zh?.trim() ?? "";
  const derived = derivedJa?.trim() ?? "";
  const en = text?.en?.trim() ?? "";
  const tw = text?.tw?.trim() ?? "";
  return ja || zh || derived || en || tw;
}

export function pickLocalizedLines(
  lines: Partial<LocalizedLines> | string[] | null | undefined,
  locale: PilgrimageLocale,
): string[] {
  if (!lines) return [];
  if (locale === "zh-tw") {
    if (Array.isArray(lines)) return [];
    return (lines.tw ?? []).map((item) => item.trim()).filter(Boolean);
  }
  if (Array.isArray(lines)) return lines.filter(Boolean);
  const zh = (lines.zh ?? []).map((item) => item.trim()).filter(Boolean);
  const ja = (lines.ja ?? []).map((item) => item.trim()).filter(Boolean);
  const en = (lines.en ?? []).map((item) => item.trim()).filter(Boolean);
  if (locale === "zh") return zh.length ? zh : ja.length ? ja : en;
  if (locale === "ja") return ja.length ? ja : en.length ? en : zh;
  return en.length ? en : ja.length ? ja : zh;
}

/** A raw string is simplified source text, so zh-TW must not display it. */
export function pickMaybeLocalizedText(
  value: Partial<LocalizedText> | string | null | undefined,
  locale: PilgrimageLocale,
): string {
  if (typeof value === "string") return locale === "zh-tw" ? "" : value;
  return pickLocalizedText(value, locale);
}
