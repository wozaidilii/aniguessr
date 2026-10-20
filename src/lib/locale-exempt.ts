/**
 * Paths that must be served at the URL the client requested.
 * Locale middleware rewrites `/ja/...` onto these and would 307 `/robots.txt`
 * to `/en/robots.txt`. Metadata routes such as `/sitemap.xml` then 404.
 */
const LOCALE_EXEMPT_PATH =
  /^\/(?:api|data|images|backgrounds|characters|sitemaps)(?:\/|$)|^\/_next\/|^\/(?:favicon\.ico|robots\.txt|sitemap\.xml|sitemap-index|manifest\.webmanifest|sw\.js|og\.png|apple-touch-icon(?:\.png)?|icon-192(?:\.png)?|icon-512(?:\.png)?)$|^\/sitemap\//;

export function shouldBypassLocale(pathname: string): boolean {
  return LOCALE_EXEMPT_PATH.test(pathname);
}
