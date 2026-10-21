import "server-only";

import { ImageResponse } from "next/og";

import type { OgCard } from "~/lib/og/card";
import { fontsFor } from "~/lib/og/fonts";
import { OG_CACHE_CONTROL, OG_CDN_CACHE_CONTROL } from "~/lib/og/metadata";
import { pilgrimageOgUrl, type OgRouteKind } from "~/lib/og/metadata";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { OgCardImage } from "~/lib/og/render";
import type { OgLoad } from "~/server/og/load";

function cacheHeaders(cacheControl: string): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", cacheControl);
  headers.set("CDN-Cache-Control", cacheControl);
  headers.set("Vercel-CDN-Cache-Control", cacheControl);
  return headers;
}

export function ogNotFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: cacheHeaders("public, max-age=60, s-maxage=300, stale-while-revalidate=86400"),
  });
}

export function ogRedirect(location: string): Response {
  const headers = cacheHeaders("public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
  headers.set("Location", location);
  return new Response(null, { status: 301, headers });
}

export async function renderOgCard(card: OgCard): Promise<Response> {
  const headers = cacheHeaders(OG_CDN_CACHE_CONTROL);
  headers.set("Cache-Control", OG_CACHE_CONTROL);
  return new ImageResponse(OgCardImage({ card }), {
    width: 1200,
    height: 630,
    fonts: await fontsFor(card.contentLocale),
    headers,
  });
}

export async function respondOg(
  locale: PilgrimageLocale,
  kind: OgRouteKind,
  loaded: OgLoad,
  follow: (id: string) => OgLoad,
): Promise<Response> {
  if (loaded.status === "missing") return ogNotFound();
  if (loaded.status === "redirect") {
    const target = follow(loaded.id);
    if (target.status !== "ready") return ogNotFound();
    return ogRedirect(pilgrimageOgUrl(locale, kind, target.id, target.card.version));
  }
  return renderOgCard(loaded.card);
}
