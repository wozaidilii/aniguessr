import { type Metadata } from "next";
import { withAnimeLocale } from "~/lib/anime-locale";
import { buildLocationIndexSeo } from "~/lib/pilgrimage-seo-meta";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { localizedPageMetadata } from "~/lib/seo";
import { getPilgrimageSeoIndex } from "~/server/data/pilgrimage-seo";
import {
  PilgrimageCard,
  PilgrimageCardGrid,
  PilgrimageShell,
  getPilgrimageRequestLocale,
} from "~/app/pilgrimage/_components/pilgrimage-ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPilgrimageRequestLocale();
  const index = getPilgrimageSeoIndex();
  const seo = buildLocationIndexSeo(locale, {
    locationCount: index?.locationCount ?? 0,
  });
  return localizedPageMetadata(
    locale,
    "/pilgrimage/locations",
    seo.title,
    seo.description,
  );
}

export default async function PilgrimageLocationsIndexPage() {
  const locale = await getPilgrimageRequestLocale();
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={copy.locationArchive}
      description={copy.hubDescription}
    >
      {!index ? (
        <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>
      ) : (
        <PilgrimageCardGrid>
          {index.locations.map((location) => (
            <PilgrimageCard
              key={location.slug}
              href={withAnimeLocale(
                `/pilgrimage/locations/${location.slug}`,
                locale,
              )}
              title={location.name}
              meta={copy.spotCountLabel(location.spotCount)}
            />
          ))}
        </PilgrimageCardGrid>
      )}
    </PilgrimageShell>
  );
}
