import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildAnimePageSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, localizedPageMetadata } from "~/lib/seo";
import { buildAnimeFilmingListJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  animeTitleIsAmbiguous,
  getAnimeBySlug,
  listSpotsForAnime,
  pickLocalizedText,
  type PilgrimageAnimeSummary,
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

function redirectMergedAnime(
  locale: AnimeLocale,
  slug: string,
  anime: PilgrimageAnimeSummary,
) {
  if (slug === anime.slug) return;
  permanentRedirect(withAnimeLocale(`/pilgrimage/anime/${anime.slug}`, locale));
}

function animePageSeo(locale: AnimeLocale, anime: PilgrimageAnimeSummary) {
  const title = pickLocalizedText(anime.animeTitle, locale);
  return applyPilgrimageSeoOverride(
    "anime",
    anime.slug,
    locale,
    buildAnimePageSeo(
      locale,
      { id: anime.subjectId, title, count: anime.spotCount },
      animeTitleIsAmbiguous(title),
    ),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const anime = getAnimeBySlug(slug);
  if (!anime) return { title: "Not found" };
  redirectMergedAnime(locale, slug, anime);

  const seo = animePageSeo(locale, anime);
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
  redirectMergedAnime(locale, slug, anime);

  const title = pickLocalizedText(anime.animeTitle, locale);
  const spots = listSpotsForAnime(anime.subjectId);
  const seo = animePageSeo(locale, anime);
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
      title={copy.spotsInAnime(title, anime.spotCount)}
      description={copy.seoAnimeDescription(title, anime.spotCount)}
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
