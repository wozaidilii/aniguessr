import { type Metadata } from "next";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildAnimeIndexSeo } from "~/lib/pilgrimage-seo-meta";
import { pilgrimagePageMetadata } from "~/lib/seo";
import {
  getPilgrimageSeoIndex,
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
  const index = getPilgrimageSeoIndex();
  const seo = buildAnimeIndexSeo(locale, {
    animeCount: index?.animeCount ?? 0,
  });
  const title = locale === "zh-tw" ? "" : seo.title;
  const description = locale === "zh-tw" ? "" : seo.description;
  return pilgrimagePageMetadata(
    locale,
    "/pilgrimage/anime",
    title,
    description,
    true,
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
  const cards = (index?.animes ?? []).map((anime) => ({
    anime,
    spotCount: anime.spotCount,
  }));

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={copy.animeArchive}
      description={copy.hubDescription}
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
      <AnitabiCredit locale={locale} className="mt-6" />
    </PilgrimageShell>
  );
}
