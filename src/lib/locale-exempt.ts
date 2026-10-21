/**
 * Paths that must be served at the URL the client requested.
 * Locale middleware would 307 `/img/game-card/ja.svg` to `/en/img/game-card/ja.svg`
 * and set `aniguessr_locale`. That URL is not a file, so the image 404s.
 * The same applies to every public asset and to `/robots.txt`.
 */
const STATIC_TREE =
  /^\/(?:api|data|images|backgrounds|characters|sitemaps|og|img|fonts|brand|not-found-shell)(?:\/|$)|^\/_next\/|^\/sitemap\//;

/** Last segment contains a dot: `ja.svg`, `robots.txt`, `favicon.ico`, `sitemap.xml`. */
const HAS_FILE_EXTENSION = /\/[^/]+\.[A-Za-z0-9]+$/;

/** Extensionless names that are still static documents. */
const NAMED_STATIC = /^\/(?:sitemap-index|apple-touch-icon)$/;

export function shouldBypassLocale(pathname: string): boolean {
  return (
    STATIC_TREE.test(pathname) ||
    HAS_FILE_EXTENSION.test(pathname) ||
    NAMED_STATIC.test(pathname)
  );
}
