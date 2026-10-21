import locationMetaOverridesJson from "../../scripts/data/location-meta-overrides.json";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import type { RenderedSeo } from "~/lib/pilgrimage-seo-meta";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";

interface LocationMetaOverride {
  title?: string;
  description?: string;
}

/**
 * Per-location document metadata. Keyed by locale, then the public location
 * slug. A filled title or description replaces the generated template and
 * any entry in `PILGRIMAGE_SEO_OVERRIDES`. The page H1 and share image do
 * not read this file.
 */
const LOCATION_META_OVERRIDES: Partial<
  Record<string, Record<string, LocationMetaOverride>>
> = locationMetaOverridesJson;

export function applyLocationMetaOverride(
  locale: PilgrimageLocale,
  slug: string,
  seo: RenderedSeo,
): RenderedSeo {
  const entry = LOCATION_META_OVERRIDES[locale]?.[slug];
  if (!entry) return seo;
  const title = entry.title?.trim();
  const description = entry.description?.trim();
  return {
    title: title ? title : seo.title,
    description: description ? description : seo.description,
  };
}

/** Template, then the TypeScript override map, then the JSON file. */
export function locationDocumentSeo(
  locale: PilgrimageLocale,
  slug: string,
  template: RenderedSeo,
): RenderedSeo {
  return applyLocationMetaOverride(
    locale,
    slug,
    applyPilgrimageSeoOverride("location", slug, locale, template),
  );
}
