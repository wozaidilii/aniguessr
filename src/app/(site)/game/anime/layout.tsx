import { type Metadata } from "next";
import { headers } from "next/headers";
import { isAnimeLocale } from "~/lib/anime-locale";
import { gameAnimeMetadata } from "~/lib/game-metadata";
import { type GameLocale } from "~/lib/game-locale";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const gameLocale = headerList.get("x-game-locale");
  const animeLocale = headerList.get("x-anime-locale");
  const locale: GameLocale =
    gameLocale === "zh-tw"
      ? "zh-tw"
      : isAnimeLocale(animeLocale)
        ? animeLocale
        : "en";
  return gameAnimeMetadata(locale);
}

export default function AnimeGameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
