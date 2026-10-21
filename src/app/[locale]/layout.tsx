import "~/styles/globals.css";
import "~/styles/home-page.css";

import { type Metadata, type Viewport } from "next";
import { notFound } from "next/navigation";

import { RootDocument } from "~/app/root-document";
import { PersistAnimeLocale } from "~/components/PersistAnimeLocale";
import { SiteShell } from "~/components/site/site-shell";
import { isAnimeLocale } from "~/lib/anime-locale";
import { HOME_LOCALES, isHomeLocale } from "~/lib/home-locale";
import { htmlLangForPilgrimage } from "~/lib/pilgrimage-locale";
import { SITE_NAME, SITE_URL } from "~/lib/seo";
import { BRAND_NAME } from "~/lib/site-url";

const HOME_TITLE = `${BRAND_NAME} | Anime Street-View Guessing Game`;

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return HOME_LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
  colorScheme: "light",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isHomeLocale(locale)) return {};

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isHomeLocale(locale)) notFound();

  return (
    <RootDocument locale={htmlLangForPilgrimage(locale)}>
      {isAnimeLocale(locale) ? <PersistAnimeLocale locale={locale} /> : null}
      <SiteShell locale={locale}>{children}</SiteShell>
    </RootDocument>
  );
}
