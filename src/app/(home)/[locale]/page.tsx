import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeView } from "~/components/home/home-view";
import { buildHomeCatalog } from "~/lib/home-catalog";
import { resolvePopularAnime } from "~/lib/popular-anime";
import { isHomeLocale } from "~/lib/home-locale";
import { homePageMetadata } from "~/lib/home-page-copy";
import { withHomeOg } from "~/lib/og/metadata";
import { getPilgrimageSeoIndex } from "~/server/data/pilgrimage-seo";
import { homeOgStaticExists } from "~/server/og/home-art";
import { loadHomeOg } from "~/server/og/load";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isHomeLocale(locale)) return {};
  const metadata = homePageMetadata(locale);
  if (homeOgStaticExists(locale)) {
    return withHomeOg(metadata, locale, { staticArt: true });
  }
  const og = loadHomeOg(locale);
  if (og.status !== "ready") return metadata;
  return withHomeOg(metadata, locale, {
    staticArt: false,
    version: og.card.version,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isHomeLocale(locale)) notFound();
  const index = getPilgrimageSeoIndex();
  const catalog = buildHomeCatalog(
    index
      ? {
          spotCount: index.spotCount,
          animeCount: index.animeCount,
          locationCount: index.locationCount,
          animes: index.animes,
          locations: index.locations,
          spots: Object.values(index.spots),
        }
      : null,
    locale,
  );
  const popularAnime = resolvePopularAnime(index?.animes ?? [], locale);
  return (
    <HomeView locale={locale} catalog={catalog} popularAnime={popularAnime} />
  );
}
