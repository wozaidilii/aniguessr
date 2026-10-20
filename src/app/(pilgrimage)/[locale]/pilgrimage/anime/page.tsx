import { type Metadata } from "next";
import { ZH_TW_AREA_COPY, getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildAnimeIndexSeo } from "~/lib/pilgrimage-seo-meta";
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
    const count = getZhTwCatalog()?.animes.length ?? 0;
    const seo = buildAnimeIndexSeo(locale, { animeCount: count });
    return zhTwOnlyPageMetadata(
      "/pilgrimage/anime",
      ZH_TW_AREA_COPY.animeTitle,
      seo.description,
    );
  }
  const index = getPilgrimageSeoIndex();
  const seo = buildAnimeIndexSeo(locale, {
    animeCount: index?.animeCount ?? 0,
  });
  return localizedPageMetadata(
    locale,
    "/pilgrimage/anime",
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageAnimeIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();
  const zhTw = locale === "zh-tw";
  const cards = zhTw
    ? (getZhTwCatalog()?.animes ?? [])
    : (index?.animes ?? []).map((anime) => ({
        anime,
        spotCount: anime.spotCount,
      }));

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={zhTw ? ZH_TW_AREA_COPY.animeTitle : copy.animeArchive}
      description={zhTw ? ZH_TW_AREA_COPY.description : copy.hubDescription}
    >
      {!index ? (
        <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>
      ) : (
        <PilgrimageCardGrid>
          {cards.map(({ anime, spotCount }) => (
            <PilgrimageCard
              key={anime.subjectId}
              href={pilgrimageHref(`/pilgrimage/anime/${anime.slug}`, locale)}
              title={pickLocalizedText(anime.animeTitle, locale)}
              meta={copy.spotCountLabel(spotCount)}
            />
          ))}
        </PilgrimageCardGrid>
      )}
    </PilgrimageShell>
  );
}
