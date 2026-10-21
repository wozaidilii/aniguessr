import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeView } from "~/components/home/home-view";
import { buildHomeCatalog } from "~/lib/home-catalog";
import { isHomeLocale } from "~/lib/home-locale";
import { homePageMetadata } from "~/lib/home-page-copy";
import { getPilgrimageSeoIndex } from "~/server/data/pilgrimage-seo";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isHomeLocale(locale)) return {};
  return homePageMetadata(locale);
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
  return <HomeView locale={locale} catalog={catalog} />;
}
