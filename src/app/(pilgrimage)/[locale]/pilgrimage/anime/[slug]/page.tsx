import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { NearbySpots } from "~/components/pilgrimage/nearby-spots";
import { PilgrimageMapPanel } from "~/components/pilgrimage/pilgrimage-map-panel";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { animeSlugMatches, encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildAnimePageSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, pilgrimagePageMetadata } from "~/lib/seo";
import { buildAnimeFilmingListJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  animeTitleIsAmbiguous,
  getAnimeBySlug,
  listSpotsForAnime,
  pickLocalizedText,
  type PilgrimageAnimeSummary,
  type PilgrimageSpot,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageShell,
  PilgrimageSpotList,
  pilgrimageHref,
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
  locale: PilgrimageLocale,
  slug: string,
  anime: PilgrimageAnimeSummary,
) {
  if (animeSlugMatches(slug, anime.slug)) return;
  permanentRedirect(pilgrimageHref(`/pilgrimage/anime/${anime.slug}`, locale));
}

function spotsForPage(anime: PilgrimageAnimeSummary): PilgrimageSpot[] {
  return listSpotsForAnime(anime.subjectId);
}

function animePageSeo(
  locale: PilgrimageLocale,
  anime: PilgrimageAnimeSummary,
  spotCount: number,
) {
  const title = pickLocalizedText(anime.animeTitle, locale);
  return applyPilgrimageSeoOverride(
    "anime",
    anime.slug,
    locale,
    buildAnimePageSeo(
      locale,
      { id: anime.subjectId, title, count: spotCount },
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
  const seo = animePageSeo(locale, anime, anime.spotCount);
  return pilgrimagePageMetadata(
    locale,
    `/pilgrimage/anime/${anime.slug}`,
    seo.title,
    seo.description,
    true,
  );
}

export default async function PilgrimageAnimePage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const anime = getAnimeBySlug(slug);
  if (!anime) notFound();
  redirectMergedAnime(locale, slug, anime);
  const spots = spotsForPage(anime);
  const spotCount = anime.spotCount;

  const title = pickLocalizedText(anime.animeTitle, locale);
  const seo = animePageSeo(locale, anime, spotCount);
  const visibleTitle = copy.spotsInAnime(title, spotCount);
  const visibleDescription = copy.seoAnimeDescription(title, spotCount);
  const jsonLd = buildAnimeFilmingListJsonLd({
    name: seo.title || visibleTitle,
    description: seo.description || visibleDescription,
    url: absoluteUrl(pilgrimageHref(`/pilgrimage/anime/${anime.slug}`, locale)),
    places: spots
      .slice(0, 24)
      .map((spot) =>
        toFilmingLocation(spot, locale, seo.description || visibleDescription),
      ),
  });

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.animeArchive}
      title={visibleTitle}
      description={visibleDescription}
    >
      <JsonLd data={jsonLd} />
      <PilgrimageMapPanel locale={locale} subjectId={anime.subjectId} />
      <NearbySpots locale={locale} />
      <PilgrimageSpotList
        locale={locale}
        spots={spots.map((spot) => ({
          id: spot.id,
          href: pilgrimageHref(
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
