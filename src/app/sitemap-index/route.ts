import { NextResponse } from "next/server";
import { buildSitemapIndexXml, sitemapFileCount } from "~/lib/sitemap-entries";
import { absoluteUrl } from "~/lib/seo";
import { listIndexablePaths } from "~/server/data/sitemap-paths";

/** Served at /sitemap.xml via a middleware rewrite. Next does not emit this index. */
export function GET() {
  const fileCount = sitemapFileCount(listIndexablePaths().length);
  const urls = Array.from({ length: fileCount }, (_, id) =>
    absoluteUrl(`/sitemap/${id}.xml`),
  );
  return new NextResponse(buildSitemapIndexXml(urls), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
