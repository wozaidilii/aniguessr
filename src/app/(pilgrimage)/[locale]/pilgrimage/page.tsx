import { type Metadata } from "next";
import Link from "next/link";
import { FavoritePicker } from "~/components/pilgrimage/favorite-picker";
import { NearbySpots } from "~/components/pilgrimage/nearby-spots";
import { PilgrimageMapPanel } from "~/components/pilgrimage/pilgrimage-map-panel";
import { ZH_TW_AREA_COPY, getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildPilgrimageHubSeo } from "~/lib/pilgrimage-seo-meta";
import { localizedPageMetadata, zhTwOnlyPageMetadata } from "~/lib/seo";
import {
  getPilgrimageSeoIndex,
  getZhTwCatalog,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageCard,
  PilgrimageCardGrid,
  PilgrimageShell,
  pilgrimageHref,
  pilgrimageLocale,
} from "~/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  if (locale === "zh-tw") {
    return zhTwOnlyPageMetadata(
      "/pilgrimage",
      ZH_TW_AREA_COPY.title,
      ZH_TW_AREA_COPY.description,
    );
  }
  const index = getPilgrimageSeoIndex();
  const seo = buildPilgrimageHubSeo(locale, {
    spotCount: index?.spotCount ?? 0,
    animeCount: index?.animeCount ?? 0,
    locationCount: index?.locationCount ?? 0,
  });
  return localizedPageMetadata(
    locale,
    "/pilgrimage",
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();

  if (!index) {
    return (
      <PilgrimageShell
        locale={locale}
        kicker={copy.siteKicker}
        title={copy.hubTitle}
        description={copy.emptyIndex}
      >
        <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>
      </PilgrimageShell>
    );
  }

  const zhTw = locale === "zh-tw" ? getZhTwCatalog() : null;
  const topAnime = zhTw
    ? zhTw.animes.slice(0, 12)
    : index.animes.slice(0, 12).map((anime) => ({ anime, spotCount: anime.spotCount }));
  const topLocations = zhTw
    ? zhTw.locations.slice(0, 12)
    : index.locations.slice(0, 12);
  const spotCount = zhTw ? zhTw.spotCount : index.spotCount;
  const animeCount = zhTw ? zhTw.animes.length : index.animeCount;
  const locationCount = zhTw ? zhTw.locations.length : index.locationCount;

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={zhTw ? ZH_TW_AREA_COPY.title : copy.hubTitle}
      description={zhTw ? ZH_TW_AREA_COPY.description : copy.hubDescription}
    >
      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label={copy.spotCountLabel(spotCount)} />
        <StatCard label={copy.animeCountLabel(animeCount)} />
        <StatCard label={copy.locationCountLabel(locationCount)} />
      </section>

      <PilgrimageMapPanel locale={locale} />
      <NearbySpots locale={locale} />
      <FavoritePicker
        locale={locale}
        animes={index.animes.map((anime) => ({
          id: anime.subjectId,
          slug: anime.slug,
          title:
            locale === "zh-tw"
              ? pickLocalizedText(anime.animeTitle, locale) ||
                anime.animeTitle.ja ||
                anime.animeTitle.en
              : pickLocalizedText(anime.animeTitle, locale),
          spotCount: anime.spotCount,
        }))}
      />

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black text-white">{copy.animeArchive}</h2>
          <Link
            href={pilgrimageHref("/pilgrimage/anime", locale)}
            className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
          >
            {copy.backAnime} →
          </Link>
        </div>
        <PilgrimageCardGrid>
          {topAnime.map(({ anime, spotCount: count }) => (
            <PilgrimageCard
              key={anime.subjectId}
              href={pilgrimageHref(`/pilgrimage/anime/${anime.slug}`, locale)}
              title={pickLocalizedText(anime.animeTitle, locale)}
              meta={copy.spotCountLabel(count)}
            />
          ))}
        </PilgrimageCardGrid>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black text-white">
            {copy.locationArchive}
          </h2>
          <Link
            href={pilgrimageHref("/pilgrimage/locations", locale)}
            className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
          >
            {copy.backLocation} →
          </Link>
        </div>
        <PilgrimageCardGrid>
          {topLocations.map((location) => (
            <PilgrimageCard
              key={location.slug}
              href={pilgrimageHref(
                `/pilgrimage/locations/${location.slug}`,
                locale,
              )}
              title={pickLocalizedText(location.name, locale)}
              meta={copy.spotCountLabel(location.spotCount)}
            />
          ))}
        </PilgrimageCardGrid>
      </section>
    </PilgrimageShell>
  );
}

function StatCard({ label }: { label: string }) {
  return (
    <div className="anime-panel p-4 text-center">
      <p className="text-sm font-black text-pink-100">{label}</p>
    </div>
  );
}
