const ANIME_LOCALES = ["zh", "ja", "en"];
const DEFAULT_LOCALE = "en";

/**
 * URLs per child sitemap. Google allows 50,000, but a dynamic Vercel
 * function response over about 4.5 MB returns HTTP 500. These files are
 * static; 2,000 URLs keeps each document near 1.5 MB.
 */
export const SITEMAP_URL_LIMIT = 2_000;

export const SITEMAP_PATHS_PER_FILE = Math.floor(
  SITEMAP_URL_LIMIT / ANIME_LOCALES.length,
);

export function sitemapFileCount(pathCount) {
  if (pathCount <= 0) return 1;
  return Math.ceil(pathCount / SITEMAP_PATHS_PER_FILE);
}

export function resolveSiteOrigin(raw = process.env.NEXT_PUBLIC_SITE_URL) {
  const fallback = "https://aniguessr.ayiora.com";
  if (!raw || !String(raw).trim()) return fallback;
  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw.trim()
    : `https://${raw.trim()}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return fallback;
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function withLocale(path, locale) {
  const bare = path.startsWith("/") ? path : `/${path}`;
  if (bare === "/") return `/${locale}`;
  return `/${locale}${bare}`;
}

export function buildSitemapIndexXml(urls) {
  const entries = urls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export function buildLocalizedSitemapEntries(
  origin,
  path,
  priority,
  lastModified,
) {
  const languages = Object.fromEntries(
    ANIME_LOCALES.map((locale) => [
      locale,
      `${origin}${withLocale(path, locale)}`,
    ]),
  );
  languages["x-default"] = `${origin}${withLocale(path, DEFAULT_LOCALE)}`;
  return ANIME_LOCALES.map((locale) => ({
    loc: `${origin}${withLocale(path, locale)}`,
    lastModified,
    changefreq: "weekly",
    priority,
    languages,
  }));
}

export function buildUrlSetXml(entries) {
  const body = entries
    .map((entry) => {
      const links = Object.entries(entry.languages ?? {})
        .map(
          ([hreflang, href]) =>
            `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
        )
        .join("");
      return `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${escapeXml(entry.lastModified)}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority>${links}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
}
