import type { Metadata } from "next";

import type { OgCard } from "~/lib/og/card";
import { OG_TEMPLATE_VERSION } from "~/lib/og/copy";
import type { HomeLocale } from "~/lib/home-locale";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { absoluteUrl } from "~/lib/seo";

export type OgRouteKind = "spots" | "anime" | "locations";

/** CDN-cached and immutable for a given id + locale + content version. */
export const OG_CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable";

export const OG_CDN_CACHE_CONTROL =
  "public, s-maxage=31536000, stale-while-revalidate=604800";

export function pilgrimageOgPath(
  locale: PilgrimageLocale,
  kind: OgRouteKind,
  id: string,
  version: string,
): string {
  return `/${locale}/pilgrimage/${kind}/${encodeURIComponent(id)}/opengraph-image?v=${encodeURIComponent(version)}`;
}

export function pilgrimageOgUrl(
  locale: PilgrimageLocale,
  kind: OgRouteKind,
  id: string,
  version: string,
): string {
  return absoluteUrl(pilgrimageOgPath(locale, kind, id, version));
}

/**
 * Designer swap point for the homepage share image.
 * Drop the final art at `public/og/home-ja.png`, `home-zh.png`,
 * `home-zh-tw.png`, and `home-en.png`. When a file is present, the
 * `/{locale}/opengraph-image` route serves it instead of the generated
 * map card. The `v=` query includes the file stamp, so crawlers refetch.
 * Also bump `OG_TEMPLATE_VERSION` when spot, work, and area cards change.
 */
export function homeOgStaticName(locale: HomeLocale): string {
  return `home-${locale}.png`;
}

export function homeOgImagePath(locale: HomeLocale, version: string): string {
  return `/${locale}/opengraph-image?v=${encodeURIComponent(version)}`;
}

export function homeOgVersion(card: OgCard, staticStamp: string | null): string {
  if (!staticStamp) return card.version;
  return `${OG_TEMPLATE_VERSION}.static.${staticStamp}`;
}

/** Attach the homepage card. Does not change canonical or hreflang. */
export function withHomeOg(
  metadata: Metadata,
  locale: HomeLocale,
  card: OgCard,
  staticStamp: string | null = null,
): Metadata {
  const url = absoluteUrl(homeOgImagePath(locale, homeOgVersion(card, staticStamp)));
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url, width: 1200, height: 630, alt: card.alt }],
    },
    twitter: {
      ...metadata.twitter,
      card: "summary_large_image",
      images: [url],
    },
  };
}

/** Attach the generated card. Does not change canonical or hreflang. */
export function withPilgrimageOg(
  metadata: Metadata,
  locale: PilgrimageLocale,
  kind: OgRouteKind,
  id: string,
  card: OgCard,
): Metadata {
  const url = pilgrimageOgUrl(locale, kind, id, card.version);
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url, width: 1200, height: 630, alt: card.alt }],
    },
    twitter: {
      card: "summary_large_image",
      images: [url],
    },
  };
}
