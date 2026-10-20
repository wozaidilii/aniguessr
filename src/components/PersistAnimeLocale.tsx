"use client";

import { useEffect } from "react";
import {
  ANIME_LOCALE_COOKIE,
  saveAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Writes the locale preference in the browser so cached HTML stays cookie-free. */
export function PersistAnimeLocale({ locale }: { locale: AnimeLocale }) {
  useEffect(() => {
    saveAnimeLocale(locale);
    document.cookie = `${ANIME_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  }, [locale]);

  return null;
}
