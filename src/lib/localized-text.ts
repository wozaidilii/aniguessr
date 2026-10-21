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

const CJK_LETTER = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u;
const LATIN_LETTER = /[A-Za-z\uFF21-\uFF3A\uFF41-\uFF5A]/u;

/** Kanji, kana, and Japanese punctuation, with no Latin letters. ヶ counts. */
export function isCjkOnlyPlace(value: string): boolean {
  const text = value.trim();
  return text.length > 0 && CJK_LETTER.test(text) && !LATIN_LETTER.test(text);
}

function hasCjkLetter(value: string): boolean {
  return CJK_LETTER.test(value);
}

export interface JaPlaceSources {
  ja?: string;
  zh?: string;
  en?: string;
  tw?: string;
  /** Scene title in Japanese, such as 竹下口アーチと商店街入口. */
  titleJa?: string;
  titleZh?: string;
  /** Manual Japanese label. There is no place-name override map yet. */
  override?: string;
}

/**
 * Japanese place label when `answerName.ja` is empty.
 * Order: authored ja, a manual override, a CJK-only zh/title/tw name,
 * a mixed CJK name, then English last.
 */
export function japanesePlaceLabel(sources: JaPlaceSources): string {
  const ja = sources.ja?.trim() ?? "";
  const zh = sources.zh?.trim() ?? "";
  const en = sources.en?.trim() ?? "";
  const tw = sources.tw?.trim() ?? "";
  const titleJa = sources.titleJa?.trim() ?? "";
  const titleZh = sources.titleZh?.trim() ?? "";
  const override = sources.override?.trim() ?? "";
  const cjk = (value: string) => (isCjkOnlyPlace(value) ? value : "");
  const mixed = (value: string) =>
    hasCjkLetter(value) && !isCjkOnlyPlace(value) ? value : "";
  const ordered = [
    ja,
    override,
    cjk(zh),
    cjk(titleJa),
    cjk(titleZh),
    cjk(tw),
    mixed(zh),
    mixed(titleJa),
    mixed(titleZh),
    mixed(tw),
    en,
    zh,
    titleJa,
    titleZh,
    tw,
  ];
  return ordered.find((value) => value.length > 0) ?? "";
}

/**
 * Spot place names. Japanese uses `japanesePlaceLabel`.
 * Every other locale keeps `pickLocalizedText`.
 */
export function pickSpotPlaceName(
  text: Partial<LocalizedText> | null | undefined,
  locale: PilgrimageLocale,
  derivedJa?: string,
  extra?: { titleZh?: string; override?: string },
): string {
  if (locale !== "ja") return pickLocalizedText(text, locale);
  return japanesePlaceLabel({
    ja: text?.ja,
    zh: text?.zh,
    en: text?.en,
    tw: text?.tw,
    titleJa: derivedJa,
    titleZh: extra?.titleZh,
    override: extra?.override,
  });
}

/** Same Japanese fallback, reading the scene title off the spot record. */
export function pickSpotPlaceFromRecord(
  answerName: Partial<LocalizedText> | null | undefined,
  title: Partial<LocalizedText> | null | undefined,
  locale: PilgrimageLocale,
  override?: string,
): string {
  return pickSpotPlaceName(answerName, locale, title?.ja, {
    titleZh: title?.zh,
    override,
  });
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
