import { type Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "~/components/JsonLd";
import {
  formatWorkTitle,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  workSpotCountLabel,
} from "~/lib/pilgrimage-nav";
import { buildAnimeGuessrImageUrl } from "~/lib/anime-guessr";
import {
  pickLocalizedLines,
  pickLocalizedText,
  pickMaybeLocalizedText,
} from "~/lib/localized-text";
import { samePlacePeerIds } from "~/lib/same-place-groups";
import { spotPlaceName } from "~/lib/spot-name-overrides";
import { screenshotCaption } from "~/lib/screenshot-caption";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { buildSpotSeo, type SpotSeoFields } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { withPilgrimageOg } from "~/lib/og/metadata";
import { absoluteUrl, pilgrimagePageMetadata } from "~/lib/seo";
import { buildTouristAttractionJsonLd } from "~/lib/structured-data";
import { loadSpotOg } from "~/server/og/load";
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
} from "~/app/[locale]/pilgrimage/_components/pilgrimage-ui";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface SamePlaceLink {
  id: string;
  href: string;
  text: string;
}

function samePlaceSections(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
): { works: SamePlaceLink[]; siblings: SamePlaceLink[] } {
  const currentWork = spot.workSubjectId ?? spot.subjectId;
  const peers = samePlacePeerIds(spot.id).flatMap((id) => {
    const other = getSpotById(id);
    if (!other || other.id === spot.id) return [];
    const place = spotPlaceName(other, locale);
    const title =
      formatWorkTitle(locale, pickLocalizedText(other.animeTitle, locale)) ||
      place;
    return [
      {
        id: other.id,
        workId: other.workSubjectId ?? other.subjectId,
        place,
        title,
        href: pilgrimageHref(
          `/pilgrimage/spots/${encodeSpotId(other.id)}`,
          locale,
        ),
      },
    ];
  });
  const siblings = peers
    .filter((item) => item.workId === currentWork)
    .map((item) => ({ id: item.id, href: item.href, text: item.place }));
  const works: SamePlaceLink[] = [];
  const others = new Map<string, typeof peers>();
  for (const item of peers) {
    if (item.workId === currentWork) continue;
    const list = others.get(item.workId);
    if (list) list.push(item);
    else others.set(item.workId, [item]);
  }
  for (const group of others.values()) {
    const first = group[0];
    if (!first) continue;
    if (group.length === 1) {
      works.push({ id: first.id, href: first.href, text: first.title });
      continue;
    }
    works.push({
      id: `${first.workId}-count`,
      href: "",
      text: `${first.title}${workSpotCountLabel(locale, group.length)}`,
    });
    for (const item of group) {
      works.push({ id: item.id, href: item.href, text: item.place });
    }
  }
  return { works, siblings };
}

function spotSeoFields(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
): SpotSeoFields {
  return {
    id: spot.id,
    anime: pickLocalizedText(spot.animeTitle, locale),
    place: spotPlaceName(spot, locale),
    area: pickLocalizedText(spot.location, locale),
    episode: pickMaybeLocalizedText(spot.episodeContext, locale),
    scene: pickLocalizedText(spot.title, locale),
  };
}

function redirectDuplicateSpot(locale: PilgrimageLocale, spot: PilgrimageSpot) {
  if (!spot.redirectTo || spot.redirectTo === spot.id) return;
  permanentRedirect(
    pilgrimageHref(
      `/pilgrimage/spots/${encodeSpotId(spot.redirectTo)}`,
      locale,
    ),
  );
}

function spotPageSeo(
  locale: PilgrimageLocale,
  spot: PilgrimageSpot,
  fields: SpotSeoFields,
) {
  return applyPilgrimageSeoOverride(
    "spot",
    spot.id,
    locale,
    buildSpotSeo(locale, fields, getSpotSeoVariant(spot, locale)),
  );
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
  const metadata = pilgrimagePageMetadata(
    locale,
    path,
    seo.title,
    seo.description,
    true,
  );
  const og = loadSpotOg(locale, spot.id);
  if (og.status !== "ready") return metadata;
  return withPilgrimageOg(metadata, locale, "spots", spot.id, og.card);
}

export default async function PilgrimageSpotPage({ params }: Props) {
  const { locale: localeParam, id } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const spot = getSpotById(id);
  if (!spot) notFound();
  redirectDuplicateSpot(locale, spot);

  const anime = pickLocalizedText(spot.animeTitle, locale);
  const place = spotPlaceName(spot, locale);
  const location = pickLocalizedText(spot.location, locale);
  const title = pickLocalizedText(spot.title, locale);
  const description = pickLocalizedText(spot.description, locale);
  const episode = pickMaybeLocalizedText(spot.episodeContext, locale);
  const facts = pickLocalizedLines(spot.funfact, locale);
  const imageUrl = buildAnimeGuessrImageUrl(spot.imagePath ?? undefined);
  const mapsUrl = `https://www.google.com/maps?q=${spot.lat},${spot.lng}`;
  const directionsUrl = googleMapsDirectionsUrl(spot.lat, spot.lng);
  const streetViewUrl = googleStreetViewUrl(spot.lat, spot.lng);
  const samePlace = samePlaceSections(spot, locale);

  const fields = spotSeoFields(spot, locale);
  const seo = spotPageSeo(locale, spot, fields);
  const jsonLd = buildTouristAttractionJsonLd({
    name: fields.place,
    description:
      locale === "zh-tw"
        ? seo.description || description
        : description || seo.description,
    url: absoluteUrl(pilgrimageHref(`/pilgrimage/spots/${spot.id}`, locale)),
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
    >
      <JsonLd data={jsonLd} />

      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="anime-panel p-5 sm:p-6">
          {imageUrl ? (
            <figure className="mb-5">
              {/* Decorative: the scene title and caption name the work. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="aspect-video w-full rounded-xl border border-white/10 object-cover"
              />
              <figcaption className="mt-2 text-xs leading-5 text-pink-100/55">
                {screenshotCaption(anime)}
              </figcaption>
            </figure>
          ) : null}

          <h2 className="text-lg font-black text-pink-100">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-pink-50/80">
            {description}
          </p>
          {samePlace.works.length + samePlace.siblings.length > 0 ? (
            <div
              className="mt-4 grid gap-2 text-sm leading-6 text-pink-100/80"
              data-testid="same-place-works"
            >
              {samePlace.works.length > 0 ? (
                <p>
                  <span className="whitespace-nowrap">
                    {copy.samePlaceWorks}
                  </span>
                  {samePlace.works.map((item) =>
                    item.href ? (
                      <a
                        key={item.id}
                        href={item.href}
                        className="ml-1 whitespace-nowrap text-cyan-100 hover:text-cyan-50"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <span key={item.id} className="ml-1 whitespace-nowrap">
                        {item.text}
                      </span>
                    ),
                  )}
                </p>
              ) : null}
              {samePlace.siblings.length > 0 ? (
                <p>
                  <span className="whitespace-nowrap">
                    {copy.samePlaceSiblings}
                  </span>
                  {samePlace.siblings.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="ml-1 whitespace-nowrap text-cyan-100 hover:text-cyan-50"
                    >
                      {item.text}
                    </a>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}

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
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="anime-button text-center text-sm whitespace-nowrap"
            >
              {copy.navigate}
            </a>
            <a
              href={streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="anime-button-secondary text-center text-sm whitespace-nowrap"
            >
              {copy.streetView}
            </a>
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
