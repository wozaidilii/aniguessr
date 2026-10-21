import { type Metadata } from "next";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildAnimeIndexSeo } from "~/lib/pilgrimage-seo-meta";
import { pilgrimagePageMetadata } from "~/lib/seo";
import {
  getPilgrimageSeoIndex,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import { AnimeIndexBrowser } from "~/components/pilgrimage/anime-index-browser";
import {
  pilgrimageHref,
  pilgrimageLocale,
} from "~/app/[locale]/pilgrimage/_components/pilgrimage-ui";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const index = getPilgrimageSeoIndex();
  const seo = buildAnimeIndexSeo(locale, {
    animeCount: index?.animeCount ?? 0,
  });
  return pilgrimagePageMetadata(
    locale,
    "/pilgrimage/anime",
    seo.title,
    seo.description,
    true,
  );
}

export default async function PilgrimageAnimeIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();
  const items = (index?.animes ?? []).map((anime) => ({
    subjectId: anime.subjectId,
    titles: anime.animeTitle,
    href: pilgrimageHref(`/pilgrimage/anime/${anime.slug}`, locale),
    title: pickLocalizedText(anime.animeTitle, locale),
    meta: copy.spotCountLabel(anime.spotCount),
  }));

  if (!index) {
    return <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>;
  }
  return <AnimeIndexBrowser locale={locale} items={items} />;
}
