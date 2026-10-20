import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { NearbySpots } from "~/components/pilgrimage/nearby-spots";
import { PilgrimageMapPanel } from "~/components/pilgrimage/pilgrimage-map-panel";
import { withAnimeLocale } from "~/lib/anime-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildLocationPageSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, localizedPageMetadata } from "~/lib/seo";
import { buildPlaceCollectionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  getLocationBySlug,
  listSpotsForLocation,
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
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
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
      <PilgrimageMapPanel locale={locale} locationSlug={location.slug} />
      <NearbySpots locale={locale} />
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
      <AnitabiCredit locale={locale} className="mt-4" />
    </PilgrimageShell>
  );
}
