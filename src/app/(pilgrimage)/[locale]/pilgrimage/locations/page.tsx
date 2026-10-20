import { type Metadata } from "next";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { ZH_TW_AREA_COPY, getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { buildLocationIndexSeo } from "~/lib/pilgrimage-seo-meta";
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
    const count = getZhTwCatalog()?.locations.length ?? 0;
    const seo = buildLocationIndexSeo(locale, { locationCount: count });
    return zhTwOnlyPageMetadata(
      "/pilgrimage/locations",
      ZH_TW_AREA_COPY.locationTitle,
      seo.description,
    );
  }
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

export default async function PilgrimageLocationsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  const copy = getPilgrimageCopy(locale);
  const index = getPilgrimageSeoIndex();
  const locations =
    locale === "zh-tw"
      ? (getZhTwCatalog()?.locations ?? [])
      : (index?.locations ?? []);

  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={
        locale === "zh-tw" ? ZH_TW_AREA_COPY.locationTitle : copy.locationArchive
      }
      description={
        locale === "zh-tw" ? ZH_TW_AREA_COPY.description : copy.hubDescription
      }
    >
      {!index ? (
        <p className="text-sm text-pink-100/70">{copy.emptyIndex}</p>
      ) : (
        <PilgrimageCardGrid>
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
        </PilgrimageCardGrid>
      )}
      <AnitabiCredit locale={locale} className="mt-6" />
    </PilgrimageShell>
  );
}
