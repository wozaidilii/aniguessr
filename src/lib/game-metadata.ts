import { type Metadata } from "next";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";
import { type GameLocale } from "~/lib/game-locale";
import { absoluteUrl, localeAlternates } from "~/lib/seo";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

const GAME_PATH = "/game/anime";

const GAME_SEO: Record<GameLocale, { title: string; description: string }> = {
  ja: {
    title: "アニメモード - AniGuessr",
    description:
      "アニメの一場面から、現実の街の場所を当てる。AniGuessr のアニメモード。",
  },
  zh: {
    title: "猜动漫模式 - AniGuessr",
    description: "看一张动漫画面，在真实街景里找出拍摄地。AniGuessr 猜动漫模式。",
  },
  "zh-tw": {
    title: "猜動漫模式 - AniGuessr",
    description: "看一張動漫畫面，在真實街景裡找出拍攝地。AniGuessr 猜動漫模式。",
  },
  en: {
    title: "Anime mode - AniGuessr",
    description:
      "Look at one anime frame and find the real place. AniGuessr anime mode.",
  },
};

/** Canonical and hreflang for the anime game, including zh-TW. */
export function gameAnimeMetadata(locale: GameLocale): Metadata {
  const seo = GAME_SEO[locale];
  const canonical =
    locale === "zh-tw"
      ? withPilgrimageLocale(GAME_PATH, "zh-tw")
      : withAnimeLocale(GAME_PATH, locale as AnimeLocale);
  const languages = localeAlternates(GAME_PATH);
  const zhTwUrl = absoluteUrl(withPilgrimageLocale(GAME_PATH, "zh-tw"));
  languages["zh-Hant"] = zhTwUrl;
  languages["zh-TW"] = zhTwUrl;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical, languages },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: locale === "zh-tw" ? "zh_TW" : locale,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}
