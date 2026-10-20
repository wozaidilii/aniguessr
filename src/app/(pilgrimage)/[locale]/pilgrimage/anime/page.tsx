import { type Metadata } from "next";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { withAnimeLocale } from "~/lib/anime-locale";
import { buildAnimeIndexSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { localizedPageMetadata } from "~/lib/seo";
import { getPilgrimageSeoIndex } from "~/server/data/pilgrimage-seo";
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
          {index.animes.map((anime) => (
            <PilgrimageCard
              key={anime.subjectId}
              href={withAnimeLocale(`/pilgrimage/anime/${anime.slug}`, locale)}
              title={anime.animeTitle}
              meta={copy.spotCountLabel(anime.spotCount)}
            />
          ))}
        </PilgrimageCardGrid>
      )}
      <AnitabiCredit locale={locale} className="mt-6" />
    </PilgrimageShell>
  );
}
