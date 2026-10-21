import {
  isAnimeLocale,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import { splitLocalePath, withPilgrimageLocale } from "~/lib/pilgrimage-locale";

/** Anime game locales. zh-tw is not an AnimeLocale, so it does not change site cookies. */
export type GameLocale = AnimeLocale | "zh-tw";

export function isGameLocale(value: unknown): value is GameLocale {
  return value === "zh-tw" || isAnimeLocale(value);
}

export function gameLocaleFromPathname(
  pathname: string | null | undefined,
): GameLocale | null {
  if (!pathname) return null;
  const { locale } = splitLocalePath(pathname);
  return isGameLocale(locale) ? locale : null;
}

/** Prefix a game path. zh-tw stays on /zh-tw and does not write the anime locale cookie. */
export function withGameLocale(path: string, locale: GameLocale): string {
  if (locale === "zh-tw") return withPilgrimageLocale(path, "zh-tw");
  return withAnimeLocale(path, locale);
}
