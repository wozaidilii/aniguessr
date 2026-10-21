import type { Metadata } from "next";

import type { OgCard } from "~/lib/og/card";
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
