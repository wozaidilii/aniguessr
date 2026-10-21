import { redirect } from "next/navigation";
import { DEFAULT_ANIME_LOCALE, withAnimeLocale } from "~/lib/anime-locale";

/** Locale homepages are real ISR routes. Bare / is chosen by middleware. */
export default function Home() {
  redirect(withAnimeLocale("/", DEFAULT_ANIME_LOCALE));
}
