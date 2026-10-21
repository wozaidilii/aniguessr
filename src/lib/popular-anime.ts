import type { HomeLocale } from "~/lib/home-locale";
import type { LocalizedText } from "~/lib/localized-text";
import { pickLocalizedText } from "~/lib/localized-text";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

/**
 * Curated homepage hooks. Order is the display order.
 * Resolved through the SEO index so merged works use the canonical page.
 */
export const POPULAR_ANIME_SUBJECT_IDS = [
  "294993",
  "362577",
  "160209",
  "328609",
  "3128",
  "207195",
  "115908",
  "240038",
] as const;

export interface PopularAnimeSource {
  subjectId: string;
  subjectIds?: readonly string[];
  slug: string;
  animeTitle: LocalizedText;
  spotCount: number;
}

export interface PopularAnimeChip {
  subjectId: string;
  slug: string;
  href: string;
  title: string;
  spotCount: number;
}

function firstFilled(values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function titleFor(text: LocalizedText, locale: HomeLocale): string {
  if (locale === "zh-tw") return firstFilled([text.tw, text.ja, text.en]);
  return pickLocalizedText(text, locale);
}

export function resolvePopularAnime(
  animes: readonly PopularAnimeSource[],
  locale: HomeLocale,
): PopularAnimeChip[] {
  const chips: PopularAnimeChip[] = [];
  const seen = new Set<string>();
  for (const id of POPULAR_ANIME_SUBJECT_IDS) {
    const anime = animes.find(
      (item) => item.subjectId === id || item.subjectIds?.includes(id),
    );
    if (!anime || seen.has(anime.subjectId) || !anime.slug) continue;
    seen.add(anime.subjectId);
    const title = titleFor(anime.animeTitle, locale) || anime.slug;
    chips.push({
      subjectId: anime.subjectId,
      slug: anime.slug,
      href: withPilgrimageLocale(`/pilgrimage/anime/${anime.slug}`, locale),
      title,
      spotCount: anime.spotCount,
    });
  }
  return chips;
}
