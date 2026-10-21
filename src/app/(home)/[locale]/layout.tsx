import "~/styles/globals.css";
import "~/styles/home-page.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { RootDocument } from "~/app/root-document";
import { PersistAnimeLocale } from "~/components/PersistAnimeLocale";
import { isAnimeLocale } from "~/lib/anime-locale";
import { HOME_LOCALES, isHomeLocale } from "~/lib/home-locale";
import { SITE_NAME, SITE_URL } from "~/lib/seo";

export const revalidate = 86_400;
export const dynamicParams = false;

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

export default async function HomeLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isHomeLocale(locale)) notFound();
  const htmlLang = locale === "zh-tw" ? "zh-Hant" : locale;
  return (
    <RootDocument locale={htmlLang}>
      {isAnimeLocale(locale) ? <PersistAnimeLocale locale={locale} /> : null}
      {children}
    </RootDocument>
  );
}
