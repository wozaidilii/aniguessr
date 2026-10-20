import { type Metadata } from "next";
import Link from "next/link";
import { withAnimeLocale } from "~/lib/anime-locale";
import { buildPilgrimageHubSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { localizedPageMetadata } from "~/lib/seo";
import {
  getPilgrimageSeoIndex,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import {
  PilgrimageCard,
  PilgrimageCardGrid,
  PilgrimageShell,
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

  const topAnime = index.animes.slice(0, 12);
  const topLocations = index.locations.slice(0, 12);

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={copy.hubTitle}
      description={copy.hubDescription}
    >
      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label={copy.spotCountLabel(index.spotCount)} />
        <StatCard label={copy.animeCountLabel(index.animeCount)} />
        <StatCard label={copy.locationCountLabel(index.locationCount)} />
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black text-white">{copy.animeArchive}</h2>
          <Link
            href={withAnimeLocale("/pilgrimage/anime", locale)}
            className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
          >
            {copy.backAnime} →
          </Link>
        </div>
        <PilgrimageCardGrid>
          {topAnime.map((anime) => (
            <PilgrimageCard
              key={anime.subjectId}
              href={withAnimeLocale(`/pilgrimage/anime/${anime.slug}`, locale)}
              title={pickLocalizedText(anime.animeTitle, locale)}
              meta={copy.spotCountLabel(anime.spotCount)}
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
            href={withAnimeLocale("/pilgrimage/locations", locale)}
            className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
          >
            {copy.backLocation} →
          </Link>
        </div>
        <PilgrimageCardGrid>
          {topLocations.map((location) => (
            <PilgrimageCard
              key={location.slug}
              href={withAnimeLocale(
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
