import { readFile } from "node:fs/promises";
import { notFoundDocumentCandidates } from "~/lib/not-found-document";
import { freezeNotFoundDocument } from "~/lib/not-found-route";
import { isPilgrimageLocale } from "~/lib/pilgrimage-locale";

async function readNotFoundDocument(locale: string): Promise<string | null> {
  for (const file of notFoundDocumentCandidates(locale)) {
    try {
      return await readFile(file, "utf8");
    } catch {
      // The next candidate is the traced copy.
    }
  }
  return null;
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  if (!isPilgrimageLocale(locale)) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const html = await readNotFoundDocument(locale);
  if (!html) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(freezeNotFoundDocument(html), {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "x-robots-tag": "noindex",
    },
  });
}
