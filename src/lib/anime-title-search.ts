import cjkSearchFold from "~/lib/cjk-search-fold.json";
import type { LocalizedText } from "~/lib/localized-text";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

/**
 * Single-character Traditional/Japanese → Simplified folds from OpenCC
 * (t/tw/hk/jp → cn). Phrase dictionaries stay out of the client bundle.
 */
const CJK_FOLD: Record<string, string> = cjkSearchFold;

export interface AnimeSearchTitles {
  zh?: string;
  ja?: string;
  en?: string;
  tw?: string;
}

export interface AnimeSearchRecord {
  subjectId: string;
  titles: AnimeSearchTitles;
  aliases?: readonly string[];
}

export interface PreparedAnimeSearch<T extends AnimeSearchRecord> {
  item: T;
  norms: string[];
}

/** NFKC, case fold, and cheap simplified/traditional folding. */
export function normalizeAnimeSearchText(value: string): string {
  const source = value.normalize("NFKC").toLowerCase();
  let folded = "";
  for (const char of source) folded += CJK_FOLD[char] ?? char;
  return folded.replace(/\s+/gu, " ").trim();
}

function normsFor(item: AnimeSearchRecord): string[] {
  const values = [
    item.titles.zh,
    item.titles.ja,
    item.titles.en,
    item.titles.tw,
    ...(item.aliases ?? []),
  ];
  const norms: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const norm = normalizeAnimeSearchText(value);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    norms.push(norm);
  }
  return norms;
}

export function prepareAnimeSearch<T extends AnimeSearchRecord>(
  items: readonly T[],
): Array<PreparedAnimeSearch<T>> {
  return items.map((item) => ({ item, norms: normsFor(item) }));
}

function rankOf(norms: readonly string[], needle: string): number {
  let best = 3;
  for (const text of norms) {
    if (text === needle) return 0;
    if (text.startsWith(needle)) best = Math.min(best, 1);
    else if (text.includes(needle)) best = Math.min(best, 2);
  }
  return best;
}

/** Exact matches, then prefix, then substring. Empty queries match nothing. */
export function matchPreparedAnimeTitles<T extends AnimeSearchRecord>(
  prepared: readonly PreparedAnimeSearch<T>[],
  query: string,
  limit?: number,
): T[] {
  const needle = normalizeAnimeSearchText(query);
  if (!needle) return [];
  const ranked: Array<{ item: T; rank: number; index: number }> = [];
  for (let index = 0; index < prepared.length; index += 1) {
    const entry = prepared[index];
    if (!entry) continue;
    const rank = rankOf(entry.norms, needle);
    if (rank < 3) ranked.push({ item: entry.item, rank, index });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.index - b.index);
  const sliced = limit === undefined ? ranked : ranked.slice(0, limit);
  return sliced.map((entry) => entry.item);
}

export function matchAnimeTitles<T extends AnimeSearchRecord>(
  items: readonly T[],
  query: string,
  limit?: number,
): T[] {
  return matchPreparedAnimeTitles(prepareAnimeSearch(items), query, limit);
}

/** Other-language titles for an in-body alias line. Skips the locale title. */
export function otherAnimeTitles(
  titles: Partial<LocalizedText> | null | undefined,
  locale: PilgrimageLocale,
): string[] {
  if (!titles) return [];
  const current =
    locale === "zh-tw"
      ? (titles.tw?.trim() ?? "")
      : locale === "zh"
        ? (titles.zh?.trim() ?? "")
        : locale === "ja"
          ? (titles.ja?.trim() ?? "")
          : (titles.en?.trim() ?? "");
  const currentNorm = current.normalize("NFKC").toLowerCase();
  const ordered = [titles.ja, titles.zh, titles.tw, titles.en];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of ordered) {
    const text = value?.trim() ?? "";
    if (!text) continue;
    const key = text.normalize("NFKC").toLowerCase();
    if (!key || key === currentNorm || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}
