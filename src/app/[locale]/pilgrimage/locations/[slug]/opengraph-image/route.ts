import { loadLocationOg, parseOgLocale } from "~/server/og/load";
import { ogNotFound, respondOg } from "~/server/og/respond";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string; slug: string }> },
): Promise<Response> {
  const { locale: localeParam, slug } = await context.params;
  const locale = parseOgLocale(localeParam);
  if (!locale) return ogNotFound();
  return respondOg(
    locale,
    "locations",
    loadLocationOg(locale, slug),
    (nextId) => loadLocationOg(locale, nextId),
  );
}