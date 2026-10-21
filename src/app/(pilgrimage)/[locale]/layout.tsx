import "~/styles/globals.css";
import "~/styles/home-page.css";

import { type Metadata, type Viewport } from "next";
import { notFound } from "next/navigation";

import { RootDocument } from "~/app/root-document";
import { HomeHeader } from "~/components/home/home-header";
import { PersistAnimeLocale } from "~/components/PersistAnimeLocale";
import { isHomeLocale } from "~/lib/home-locale";
import { ANIME_LOCALES, isAnimeLocale } from "~/lib/anime-locale";
import {
  htmlLangForPilgrimage,
  isPilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { SITE_NAME, SITE_URL } from "~/lib/seo";
import { BRAND_NAME } from "~/lib/site-url";

const HOME_TITLE = `${BRAND_NAME} | Anime Street-View Guessing Game`;

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return ANIME_LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0a0612",
  colorScheme: "dark",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isPilgrimageLocale(locale)) return {};

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: HOME_TITLE,
      template: `%s · ${SITE_NAME}`,
    },
    applicationName: SITE_NAME,
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

export default async function PilgrimageLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPilgrimageLocale(locale)) notFound();

  return (
    <RootDocument locale={htmlLangForPilgrimage(locale)}>
      {isAnimeLocale(locale) ? <PersistAnimeLocale locale={locale} /> : null}
      {isHomeLocale(locale) ? <HomeHeader locale={locale} /> : null}
      {children}
    </RootDocument>
  );
}
