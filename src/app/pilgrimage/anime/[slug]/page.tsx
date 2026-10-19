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
  getPilgrimageSeoIndex,
  listSpotsForAnime,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageShell,
  PilgrimageSpotList,
  getPilgrimageRequestLocale,
} from "~/app/pilgrimage/_components/pilgrimage-ui";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const index = getPilgrimageSeoIndex();
  if (!index) return [];
  return index.animes.map((anime) => ({ slug: anime.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getPilgrimageRequestLocale();
  const { slug } = await params;
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
  const locale = await getPilgrimageRequestLocale();
  const copy = getPilgrimageCopy(locale);
  const { slug } = await params;
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
