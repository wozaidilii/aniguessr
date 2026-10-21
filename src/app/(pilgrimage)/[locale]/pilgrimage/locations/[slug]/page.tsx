import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import { NearbySpots } from "~/components/pilgrimage/nearby-spots";
import { PilgrimageMapPanel } from "~/components/pilgrimage/pilgrimage-map-panel";
import { pickSpotPlaceFromRecord } from "~/lib/localized-text";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { buildLocationPageSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { withPilgrimageOg } from "~/lib/og/metadata";
import { absoluteUrl, pilgrimagePageMetadata } from "~/lib/seo";
import { buildPlaceCollectionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";
import { loadLocationOg } from "~/server/og/load";
import {
  listSpotsForLocation,
  pickLocalizedText,
  resolveLocationSlug,
  type PilgrimageLocationSummary,
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

function redirectLocationSlug(
  locale: PilgrimageLocale,
  resolved: { location: PilgrimageLocationSummary; redirect: boolean },
) {
  if (!resolved.redirect) return;
  permanentRedirect(
    pilgrimageHref(`/pilgrimage/locations/${resolved.location.slug}`, locale),
  );
}

function locationPageSeo(
  locale: PilgrimageLocale,
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
  const metadata = pilgrimagePageMetadata(
    locale,
    `/pilgrimage/locations/${resolved.location.slug}`,
    seo.title,
    seo.description,
    true,
  );
  const og = loadLocationOg(locale, resolved.location.slug);
  if (og.status !== "ready") return metadata;
  return withPilgrimageOg(
    metadata,
    locale,
    "locations",
    resolved.location.slug,
    og.card,
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
  const visibleTitle = copy.spotsInLocation(name, location.spotCount);
  const visibleDescription = copy.seoLocationDescription(
    name,
    location.spotCount,
  );
  const jsonLd = buildPlaceCollectionJsonLd({
    name: locale === "zh-tw" ? seo.title || visibleTitle : name,
    description:
      locale === "zh-tw"
        ? seo.description || visibleDescription
        : seo.description,
    url: absoluteUrl(
      pilgrimageHref(`/pilgrimage/locations/${location.slug}`, locale),
    ),
    latitude: listed[0]?.lat,
    longitude: listed[0]?.lng,
    places: listed.map((spot) =>
      toFilmingLocation(
        spot,
        locale,
        locale === "zh-tw"
          ? seo.description || visibleDescription
          : seo.description,
      ),
    ),
  });

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.locationArchive}
      title={visibleTitle}
      description={visibleDescription}
    >
      <JsonLd data={jsonLd} />
      <PilgrimageMapPanel locale={locale} locationSlug={location.slug} />
      <NearbySpots locale={locale} />
      <PilgrimageSpotList
        locale={locale}
        spots={spots.map((spot) => ({
          id: spot.id,
          href: pilgrimageHref(
            `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
            locale,
          ),
          title: pickSpotPlaceFromRecord(spot.answerName, spot.title, locale),
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
