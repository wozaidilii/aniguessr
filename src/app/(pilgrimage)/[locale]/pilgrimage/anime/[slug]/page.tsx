import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { withAnimeLocale } from "~/lib/anime-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildAnimePageSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, localizedPageMetadata } from "~/lib/seo";
import { buildAnimeFilmingListJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  animeTitleIsAmbiguous,
  getAnimeBySlug,
  listSpotsForAnime,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageShell,
  PilgrimageSpotList,
  pilgrimageLocale,
} from "~/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const anime = getAnimeBySlug(slug);
  if (!anime) return { title: "Not found" };

  const seo = buildAnimePageSeo(
    locale,
    { id: anime.subjectId, title: anime.animeTitle, count: anime.spotCount },
    animeTitleIsAmbiguous(anime.animeTitle),
  );
  return localizedPageMetadata(
    locale,
    `/pilgrimage/anime/${anime.slug}`,
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageAnimePage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const anime = getAnimeBySlug(slug);
  if (!anime) notFound();

  const spots = listSpotsForAnime(anime.subjectId);
  const seo = buildAnimePageSeo(
    locale,
    { id: anime.subjectId, title: anime.animeTitle, count: anime.spotCount },
    animeTitleIsAmbiguous(anime.animeTitle),
  );
  const jsonLd = buildAnimeFilmingListJsonLd({
    name: seo.title,
    description: seo.description,
    url: absoluteUrl(
      withAnimeLocale(`/pilgrimage/anime/${anime.slug}`, locale),
    ),
    places: spots
      .slice(0, 24)
      .map((spot) => toFilmingLocation(spot, locale, seo.description)),
  });

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.animeArchive}
      title={copy.spotsInAnime(anime.animeTitle, anime.spotCount)}
      description={copy.seoAnimeDescription(anime.animeTitle, anime.spotCount)}
    >
      <JsonLd data={jsonLd} />
      <PilgrimageSpotList
        locale={locale}
        spots={spots.map((spot) => ({
          id: spot.id,
          href: withAnimeLocale(
            `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
            locale,
          ),
          title: pickLocalizedText(spot.answerName, locale),
          subtitle: pickLocalizedText(spot.title, locale),
        }))}
      />
      {anime.spotCount > spots.length ? (
        <p className="mt-4 text-xs text-pink-100/50">
          {spots.length} / {anime.spotCount} spots listed
        </p>
      ) : null}
    </PilgrimageShell>
  );
}
