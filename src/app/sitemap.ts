import { type MetadataRoute } from "next";
import {
  buildLocalizedSitemapEntries,
  SITEMAP_PATHS_PER_FILE,
  sitemapFileCount,
} from "~/lib/sitemap-entries";
import { listIndexablePaths } from "~/server/data/sitemap-paths";

export async function generateSitemaps() {
  const total = sitemapFileCount(listIndexablePaths().length);
  return Array.from({ length: total }, (_, index) => ({ id: String(index) }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const chunk = Number.isFinite(id) && id >= 0 ? id : 0;
  const lastModified = new Date();
  const paths = listIndexablePaths().slice(
    chunk * SITEMAP_PATHS_PER_FILE,
    (chunk + 1) * SITEMAP_PATHS_PER_FILE,
  );

  return paths.flatMap(({ path, priority }) =>
    buildLocalizedSitemapEntries(path, priority, lastModified),
  );
}
