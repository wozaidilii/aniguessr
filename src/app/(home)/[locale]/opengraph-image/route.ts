import { readFileSync } from "node:fs";

import { isHomeLocale } from "~/lib/home-locale";
import { homeOgStaticExists, homeOgStaticFile } from "~/server/og/home-art";
import { loadHomeOg, parseOgLocale } from "~/server/og/load";
import { ogImageHeaders, ogNotFound, renderOgCard } from "~/server/og/respond";

export const runtime = "nodejs";

/**
 * Generated homepage share image.
 * Crawlers are pointed at `public/og/home-{locale}.png` when that file exists.
 * This route still serves the file for older URLs, and paints the map card
 * only when the static PNG is absent.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale: localeParam } = await context.params;
  const locale = parseOgLocale(localeParam);
  if (!locale || !isHomeLocale(locale)) return ogNotFound();
  if (homeOgStaticExists(locale)) {
    const headers = ogImageHeaders();
    headers.set("Content-Type", "image/png");
    return new Response(readFileSync(homeOgStaticFile(locale)), { headers });
  }
  const loaded = loadHomeOg(locale);
  if (loaded.status !== "ready") return ogNotFound();
  return renderOgCard(loaded.card);
}
