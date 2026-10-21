import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

export interface LocalizedText {
  zh: string;
  ja: string;
  en: string;
  /** Traditional Chinese for pilgrimage records. zh-TW does not fall back to zh. */
  tw?: string;
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
