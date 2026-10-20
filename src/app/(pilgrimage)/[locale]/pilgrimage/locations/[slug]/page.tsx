import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildLocationPageSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, localizedPageMetadata } from "~/lib/seo";
import { buildPlaceCollectionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import {
  listSpotsForLocation,
  pickLocalizedText,
  resolveLocationSlug,
  type PilgrimageLocationSummary,
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

function redirectLocationSlug(
  locale: AnimeLocale,
  resolved: { location: PilgrimageLocationSummary; redirect: boolean },
) {
  if (!resolved.redirect) return;
  permanentRedirect(
    withAnimeLocale(`/pilgrimage/locations/${resolved.location.slug}`, locale),
  );
}

function locationPageSeo(
  locale: AnimeLocale,
  location: PilgrimageLocationSummary,
) {
  const name = pickLocalizedText(location.name, locale);
  return applyPilgrimageSeoOverride(
    "location",
    location.slug,
    locale,
    buildLocationPageSeo(locale, { name, count: location.spotCount }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const resolved = resolveLocationSlug(slug);
  if (!resolved) return { title: "Not found" };
  redirectLocationSlug(locale, resolved);

  const seo = locationPageSeo(locale, resolved.location);
  return localizedPageMetadata(
    locale,
    `/pilgrimage/locations/${resolved.location.slug}`,
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageLocationPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const resolved = resolveLocationSlug(slug);
  if (!resolved) notFound();
  redirectLocationSlug(locale, resolved);
  const location = resolved.location;
  const name = pickLocalizedText(location.name, locale);

  const spots = listSpotsForLocation(location.slug).slice(0, 120);
  const seo = locationPageSeo(locale, location);
  const listed = spots.slice(0, 24);
  const jsonLd = buildPlaceCollectionJsonLd({
    name,
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
      title={copy.spotsInLocation(name, location.spotCount)}
      description={copy.seoLocationDescription(name, location.spotCount)}
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
