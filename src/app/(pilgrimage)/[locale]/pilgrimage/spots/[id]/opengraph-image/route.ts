import { parseOgLocale, loadSpotOg } from "~/server/og/load";
import { ogNotFound, respondOg } from "~/server/og/respond";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string; id: string }> },
): Promise<Response> {
  const { locale: localeParam, id } = await context.params;
  const locale = parseOgLocale(localeParam);
  if (!locale) return ogNotFound();
  return respondOg(locale, "spots", loadSpotOg(locale, id), (nextId) =>
    loadSpotOg(locale, nextId),
  );
}
