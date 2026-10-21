import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { headers } from "next/headers";

import { RootDocument } from "~/app/root-document";
import {
  DEFAULT_ANIME_LOCALE,
  isAnimeLocale,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import {
  SITE_DESCRIPTIONS,
  SITE_NAME,
  SITE_URL,
  localeAlternates,
} from "~/lib/seo";
import { BRAND_NAME } from "~/lib/site-url";

const HOME_TITLE = `${BRAND_NAME} | Anime Street-View Guessing Game`;

const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

async function getRequestLocale(): Promise<{
  locale: AnimeLocale;
  lang: string;
}> {
  const headerList = await headers();
  if (headerList.get("x-game-locale") === "zh-tw") {
    return { locale: "zh", lang: "zh-Hant" };
  }
  const headerLocale = headerList.get("x-anime-locale");
  const locale = isAnimeLocale(headerLocale) ? headerLocale : DEFAULT_ANIME_LOCALE;
  return { locale, lang: locale };
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getRequestLocale();
  const description = SITE_DESCRIPTIONS[locale];
  const canonicalPath = withAnimeLocale("/", locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: HOME_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: [
      "AniGuessr",
      "anime guessing game",
      "anime street view",
      "anime pilgrimage",
      "聖地巡礼",
      "圣地巡礼",
      "geoguessr anime",
      "アニメ 聖地 当て",
    ],
    alternates: {
      canonical: canonicalPath,
      languages: localeAlternates("/"),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      title: HOME_TITLE,
      description,
      url: canonicalPath,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_TITLE,
      description,
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: [
      {
        rel: "icon",
        url: "/icon-192.png?v=20260620",
        type: "image/png",
        sizes: "192x192",
      },
      {
        rel: "icon",
        url: "/icon-512.png?v=20260620",
        type: "image/png",
        sizes: "512x512",
      },
      {
        rel: "apple-touch-icon",
        url: "/apple-touch-icon.png?v=20260620",
        type: "image/png",
        sizes: "180x180",
      },
      { rel: "shortcut icon", url: "/favicon.ico?v=20260620" },
    ],
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { lang } = await getRequestLocale();
  return <RootDocument locale={lang}>{children}</RootDocument>;
}
