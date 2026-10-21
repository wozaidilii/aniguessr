import { readFileSync } from "node:fs";

import { isHomeLocale } from "~/lib/home-locale";
import { homeOgStaticFile, homeOgStaticStamp } from "~/server/og/home-art";
import { loadHomeOg, parseOgLocale } from "~/server/og/load";
import { ogImageHeaders, ogNotFound, renderOgCard } from "~/server/og/respond";

export const runtime = "nodejs";

/**
 * Homepage share image.
 * If `public/og/home-{locale}.png` exists, that file is the response.
 * Otherwise the route paints the #13 map-and-text card.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale: localeParam } = await context.params;
  const locale = parseOgLocale(localeParam);
  if (!locale || !isHomeLocale(locale)) return ogNotFound();
  if (homeOgStaticStamp(locale)) {
    const headers = ogImageHeaders();
    headers.set("Content-Type", "image/png");
    return new Response(readFileSync(homeOgStaticFile(locale)), { headers });
  }
  const loaded = loadHomeOg(locale);
  if (loaded.status !== "ready") return ogNotFound();
  return renderOgCard(loaded.card);
}
