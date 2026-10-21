import { type Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import {
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
} from "~/lib/pilgrimage-nav";
import { buildAnimeGuessrImageUrl } from "~/lib/anime-guessr";
import {
  pickLocalizedLines,
  pickLocalizedText,
  pickMaybeLocalizedText,
} from "~/lib/localized-text";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildSpotSeo, type SpotSeoFields } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { absoluteUrl, pilgrimagePageMetadata } from "~/lib/seo";
import { buildTouristAttractionJsonLd } from "~/lib/structured-data";
import {
  getSpotById,
  getSpotSeoVariant,
  type PilgrimageSpot,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageShell,
  pilgrimageHref,
  pilgrimageLocale,
  pilgrimageSiteHref,
} from "~/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

function spotSeoFields(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
): SpotSeoFields {
  return {
    id: spot.id,
    anime: pickLocalizedText(spot.animeTitle, locale),
    place: pickLocalizedText(spot.answerName, locale),
    area: pickLocalizedText(spot.location, locale),
    episode: pickMaybeLocalizedText(spot.episodeContext, locale),
    scene: pickLocalizedText(spot.title, locale),
  };
}

function redirectDuplicateSpot(locale: PilgrimageLocale, spot: PilgrimageSpot) {
  if (!spot.redirectTo || spot.redirectTo === spot.id) return;
  permanentRedirect(
    pilgrimageHref(`/pilgrimage/spots/${encodeSpotId(spot.redirectTo)}`, locale),
  );
}

function spotPageSeo(
  locale: PilgrimageLocale,
  spot: PilgrimageSpot,
  fields: SpotSeoFields,
) {
  if (locale === "zh-tw") {
    return applyPilgrimageSeoOverride("spot", spot.id, "zh-tw", {
      title: "",
      description: "",
    });
  }
  return buildSpotSeo(locale, fields, getSpotSeoVariant(spot, locale));
}

function absoluteAssetUrl(url: string | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(url);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  const locale = pilgrimageLocale(localeParam);
  const spot = getSpotById(id);
  if (!spot) return { title: "Not found" };
  redirectDuplicateSpot(locale, spot);

  const fields = spotSeoFields(spot, locale);
  const seo = spotPageSeo(locale, spot, fields);
  const path = `/pilgrimage/spots/${id}`;
  const imageUrl = buildAnimeGuessrImageUrl(spot.imagePath ?? undefined);
  const metadata = pilgrimagePageMetadata(
    locale,
    path,
    seo.title,
    seo.description,
    true,
  );

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: imageUrl ? [{ url: imageUrl, alt: fields.place }] : undefined,
    },
  };
}

export default async function PilgrimageSpotPage({ params }: Props) {
  const { locale: localeParam, id } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const spot = getSpotById(id);
  if (!spot) notFound();
  redirectDuplicateSpot(locale, spot);

  const anime = pickLocalizedText(spot.animeTitle, locale);
  const place = pickLocalizedText(spot.answerName, locale);
  const location = pickLocalizedText(spot.location, locale);
  const title = pickLocalizedText(spot.title, locale);
  const description = pickLocalizedText(spot.description, locale);
  const episode = pickMaybeLocalizedText(spot.episodeContext, locale);
  const facts = pickLocalizedLines(spot.funfact, locale);
  const imageUrl = buildAnimeGuessrImageUrl(spot.imagePath ?? undefined);
  const mapsUrl = `https://www.google.com/maps?q=${spot.lat},${spot.lng}`;
  const directionsUrl = googleMapsDirectionsUrl(spot.lat, spot.lng);
  const streetViewUrl = googleStreetViewUrl(spot.lat, spot.lng);

  const fields = spotSeoFields(spot, locale);
  const seo = spotPageSeo(locale, spot, fields);
  const visibleDescription = pickLocalizedText(spot.description, locale);
  const jsonLd = buildTouristAttractionJsonLd({
    name: fields.place,
    description:
      locale === "zh-tw"
        ? seo.description || visibleDescription
        : visibleDescription || seo.description,
    url: absoluteUrl(pilgrimageHref(`/pilgrimage/spots/${spot.id}`, locale)),
    image: absoluteAssetUrl(imageUrl),
    latitude: spot.lat,
    longitude: spot.lng,
    area: fields.area,
    anime: fields.anime,
    episode: fields.episode,
  });

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.spotDetail}
      title={copy.seoSpotTitle(anime, place)}
      description={description}
    >
      <JsonLd data={jsonLd} />

      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="anime-panel p-5 sm:p-6">
          {imageUrl ? (
            <figure className="mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="aspect-video w-full rounded-xl border border-white/10 object-cover"
              />
            </figure>
          ) : null}

          <h2 className="text-lg font-black text-pink-100">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-pink-50/80">
            {description}
          </p>

          {episode ? (
            <section className="mt-6">
              <h3 className="text-xs font-black tracking-[0.16em] text-cyan-100/70 uppercase">
                {copy.episode}
              </h3>
              <p className="mt-2 text-sm text-pink-50/75">{episode}</p>
            </section>
          ) : null}

          {facts.length > 0 ? (
            <section className="mt-6">
              <h3 className="text-xs font-black tracking-[0.16em] text-cyan-100/70 uppercase">
                {copy.funfacts}
              </h3>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-pink-50/75">
                {facts.map((fact, index) => (
                  <li
                    key={`${fact}-${index}`}
                    className="rounded-lg bg-white/5 px-3 py-2"
                  >
                    {fact}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="anime-panel h-fit p-5">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-bold text-pink-100/60">
                {copy.relatedAnime}
              </dt>
              <dd className="mt-1 font-black text-white">
                <Link
                  href={pilgrimageHref(
                    `/pilgrimage/anime/${spot.subjectSlug}`,
                    locale,
                  )}
                  className="text-cyan-100 hover:text-cyan-50"
                >
                  {anime}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-pink-100/60">
                {copy.relatedLocation}
              </dt>
              <dd className="mt-1 font-black text-white">
                <Link
                  href={pilgrimageHref(
                    `/pilgrimage/locations/${spot.locationSlug}`,
                    locale,
                  )}
                  className="text-cyan-100 hover:text-cyan-50"
                >
                  {location}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-pink-100/60">
                {copy.answerName}
              </dt>
              <dd className="mt-1 font-bold text-pink-50">{place}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-pink-100/60">
                {copy.coordinates}
              </dt>
              <dd className="mt-1 font-mono text-xs text-pink-50/80">
                {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-2">
            <div className="flex gap-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="anime-button flex-1 text-center text-sm"
              >
                {copy.navigate}
              </a>
              <a
                href={streetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="anime-button-secondary flex-1 text-center text-sm"
              >
                {copy.streetView}
              </a>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="anime-button-secondary block text-center text-sm"
            >
              {copy.openMaps}
            </a>
            <Link
              href={pilgrimageSiteHref("/game/anime", locale)}
              className="block text-center text-xs font-bold text-cyan-100/70 hover:text-cyan-50"
            >
              {copy.playGame}
            </Link>
          </div>
        </aside>
      </article>
    </PilgrimageShell>
  );
}
