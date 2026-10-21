import { type Metadata } from "next";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildLocationIndexSeo } from "~/lib/pilgrimage-seo-meta";
import { pilgrimagePageMetadata } from "~/lib/seo";
import {
  getPilgrimageSeoIndex,
  pickLocalizedText,
} from "~/server/data/pilgrimage-seo";
import { DeferPaint } from "~/components/site/defer-paint";
import {
  PilgrimageCard,
  PilgrimageCardGrid,
  pilgrimageHref,
  pilgrimageLocale,
} from "~/app/[locale]/pilgrimage/_components/pilgrimage-ui";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const index = getPilgrimageSeoIndex();
  const seo = buildLocationIndexSeo(locale, {
    locationCount: index?.locationCount ?? 0,
  });
  return pilgrimagePageMetadata(
    locale,
    "/pilgrimage/locations",
    seo.title,
    seo.description,
    true,
  );
}

export default async function PilgrimageLocationsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();
  const locations = index?.locations ?? [];

  if (!index) {
    return <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>;
  }

  return (
    <PilgrimageCardGrid>
      <DeferPaint>
        {locations.map((location) => (
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
      </DeferPaint>
    </PilgrimageCardGrid>
  );
}
