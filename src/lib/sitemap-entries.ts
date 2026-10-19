import { type MetadataRoute } from "next";
import {
  ANIME_LOCALES,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import { absoluteUrl, localeAlternates } from "~/lib/seo";

/** Stay under Google's 50,000 URL / 50MB sitemap file limits. */
export const SITEMAP_URL_LIMIT = 45_000;

export const SITEMAP_PATHS_PER_FILE = Math.floor(
  SITEMAP_URL_LIMIT / ANIME_LOCALES.length,
);

export function sitemapFileCount(pathCount: number): number {
  if (pathCount <= 0) return 1;
  return Math.ceil(pathCount / SITEMAP_PATHS_PER_FILE);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Sitemap index document. Next's generateSitemaps only emits /sitemap/[id].xml. */
export function buildSitemapIndexXml(urls: string[]): string {
  const entries = urls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function buildLocalizedSitemapEntries(
  path: string,
  priority: number,
  lastModified: Date,
): MetadataRoute.Sitemap {
  const languages = localeAlternates(path);
  return ANIME_LOCALES.map((locale: AnimeLocale) => ({
    url: absoluteUrl(withAnimeLocale(path, locale)),
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages },
  }));
}
