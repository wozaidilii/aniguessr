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

/**
 * @param {{ zhTw?: boolean }} [options]
 * zhTw adds /zh-tw plus hreflang zh-Hant and zh-TW on every locale of this path.
 * Leave it false for pages that have no Traditional version.
 */
export function buildLocalizedSitemapEntries(
  origin,
  path,
  priority,
  lastModified,
  options = {},
) {
  const languages = Object.fromEntries(
    ANIME_LOCALES.map((locale) => [
      locale,
      `${origin}${withLocale(path, locale)}`,
    ]),
  );
  languages["x-default"] = `${origin}${withLocale(path, DEFAULT_LOCALE)}`;
  const locales = [...ANIME_LOCALES];
  if (options.zhTw) {
    const zhTwUrl = `${origin}${withLocale(path, "zh-tw")}`;
    languages["zh-Hant"] = zhTwUrl;
    languages["zh-TW"] = zhTwUrl;
    locales.push("zh-tw");
  }
  return locales.map((locale) => ({
    loc: `${origin}${withLocale(path, locale)}`,
    lastModified,
    changefreq: "weekly",
    priority,
    languages,
  }));
}

/** /rights exists in zh, ja, en, and zh-tw, with zh-Hant and zh-TW alternates. */
export function rightsSitemapItem() {
  return { path: "/rights", priority: 0.4, zhTw: true };
}

/** A document that exists only in zh-TW. Not an alternate of the zh/ja/en page. */
export function buildZhTwOnlySitemapEntries(
  origin,
  path,
  priority,
  lastModified,
) {
  const loc = `${origin}${withLocale(path, "zh-tw")}`;
  return [
    {
      loc,
      lastModified,
      changefreq: "weekly",
      priority,
      languages: {
        "zh-Hant": loc,
        "zh-TW": loc,
      },
    },
  ];
}

export function sitemapEntryCount(item) {
  if (item.zhTwOnly) return 1;
  return item.zhTw ? ANIME_LOCALES.length + 1 : ANIME_LOCALES.length;
}

/** Chunk by URL count so a covered path's extra zh-TW URL cannot push a file over the cap. */
export function chunkSitemapPaths(items, limit = SITEMAP_URL_LIMIT) {
  const chunks = [];
  let current = [];
  let count = 0;
  for (const item of items) {
    const size = sitemapEntryCount(item);
    if (current.length > 0 && count + size > limit) {
      chunks.push(current);
      current = [];
      count = 0;
    }
    current.push(item);
    count += size;
  }
  if (current.length > 0 || chunks.length === 0) chunks.push(current);
  return chunks;
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
