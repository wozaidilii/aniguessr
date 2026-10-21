import type { Metadata } from "next";

import type { OgCard } from "~/lib/og/card";
import { homeHeadingText } from "~/lib/home-page-copy";
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
 * Cache-bust for the four static homepage share images in `public/og/`.
 * Bump this when those PNGs are replaced. Spot, work, and area cards use
 * `OG_TEMPLATE_VERSION` instead.
 */
export const HOME_OG_ASSET_VERSION = "2";

export function homeOgStaticName(locale: HomeLocale): string {
  return `home-${locale}.png`;
}

/** Public URL of the designer's homepage PNG. */
export function homeOgStaticPublicPath(locale: HomeLocale): string {
  return `/og/${homeOgStaticName(locale)}?v=${encodeURIComponent(HOME_OG_ASSET_VERSION)}`;
}

/** Generated map card, used only when the static PNG is absent. */
export function homeOgFallbackPath(
  locale: HomeLocale,
  version: string,
): string {
  return `/${locale}/opengraph-image?v=${encodeURIComponent(version)}`;
}

export type HomeOgSource =
  | { staticArt: true }
  | { staticArt: false; version: string };

/**
 * Homepage og:image. A file at `public/og/home-{locale}.png` wins over the
 * generated map card. Alt is the locale's homepage H1.
 * Does not change canonical or hreflang.
 */
export function withHomeOg(
  metadata: Metadata,
  locale: HomeLocale,
  source: HomeOgSource,
): Metadata {
  const alt = homeHeadingText(locale);
  const url = absoluteUrl(
    source.staticArt
      ? homeOgStaticPublicPath(locale)
      : homeOgFallbackPath(locale, source.version),
  );
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [{ url, type: "image/png", width: 1200, height: 630, alt }],
    },
    twitter: {
      ...metadata.twitter,
      card: "summary_large_image",
      images: [{ url, alt }],
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
      ...metadata.twitter,
      card: "summary_large_image",
      images: [url],
    },
  };
}
