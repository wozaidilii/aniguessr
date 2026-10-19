import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { withAnimeLocale } from "~/lib/anime-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildLocationPageSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, localizedPageMetadata } from "~/lib/seo";
import { buildPlaceCollectionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  getLocationBySlug,
  getPilgrimageSeoIndex,
  listSpotsForLocation,
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
  return index.locations.map((location) => ({ slug: location.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getPilgrimageRequestLocale();
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return { title: "Not found" };

  const seo = buildLocationPageSeo(locale, {
    name: location.name,
    count: location.spotCount,
  });
  return localizedPageMetadata(
    locale,
    `/pilgrimage/locations/${location.slug}`,
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageLocationPage({ params }: Props) {
  const locale = await getPilgrimageRequestLocale();
  const copy = getPilgrimageCopy(locale);
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const spots = listSpotsForLocation(location.slug).slice(0, 120);
  const seo = buildLocationPageSeo(locale, {
    name: location.name,
    count: location.spotCount,
  });
  const listed = spots.slice(0, 24);
  const jsonLd = buildPlaceCollectionJsonLd({
    name: location.name,
    description: seo.description,
    url: absoluteUrl(
      withAnimeLocale(`/pilgrimage/locations/${location.slug}`, locale),
    ),
    latitude: listed[0]?.lat,
    longitude: listed[0]?.lng,
    places: listed.map((spot) =>
      toFilmingLocation(spot, locale, seo.description),
    ),
  });

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.locationArchive}
      title={copy.spotsInLocation(location.name, location.spotCount)}
      description={copy.seoLocationDescription(
        location.name,
        location.spotCount,
      )}
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
          subtitle: pickLocalizedText(spot.animeTitle, locale),
        }))}
      />
      {location.spotCount > spots.length ? (
        <p className="mt-4 text-xs text-pink-100/50">
          + {location.spotCount - spots.length} more spots indexed
        </p>
      ) : null}
    </PilgrimageShell>
  );
}
