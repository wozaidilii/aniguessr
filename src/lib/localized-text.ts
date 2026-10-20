import { type AnimeLocale } from "~/lib/anime-locale";

export interface LocalizedText {
  zh: string;
  ja: string;
  en: string;
}

export interface LocalizedLines {
  zh: string[];
  ja: string[];
  en: string[];
}

/**
 * Locale text with a deliberate fallback order.
 * English prefers Japanese (original / romaji) over Chinese.
 * Japanese prefers English over Chinese.
 */
export function pickLocalizedText(
  text: Partial<LocalizedText> | null | undefined,
  locale: AnimeLocale,
): string {
  if (!text) return "";
  const zh = text.zh?.trim() ?? "";
  const ja = text.ja?.trim() ?? "";
  const en = text.en?.trim() ?? "";
  if (locale === "zh") return zh || ja || en;
  if (locale === "ja") return ja || en || zh;
  return en || ja || zh;
}

export function pickLocalizedLines(
  lines: Partial<LocalizedLines> | string[] | null | undefined,
  locale: AnimeLocale,
): string[] {
  if (!lines) return [];
  if (Array.isArray(lines)) return lines.filter(Boolean);
  const zh = (lines.zh ?? []).map((item) => item.trim()).filter(Boolean);
  const ja = (lines.ja ?? []).map((item) => item.trim()).filter(Boolean);
  const en = (lines.en ?? []).map((item) => item.trim()).filter(Boolean);
  if (locale === "zh") return zh.length ? zh : ja.length ? ja : en;
  if (locale === "ja") return ja.length ? ja : en.length ? en : zh;
  return en.length ? en : ja.length ? ja : zh;
}
