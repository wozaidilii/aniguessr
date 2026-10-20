import { parseLocaleFromPathname } from "~/lib/anime-locale";

/**
 * ISR window for pilgrimage HTML. Spot data is rebuilt with the app, not per request.
 * Route files must copy this number into `export const revalidate` directly.
 * Next.js only accepts a literal in segment config, not an imported binding.
 */
export const PILGRIMAGE_REVALIDATE_SECONDS = 86_400;

/**
 * Public URLs like `/ja/pilgrimage/spots/...`.
 * These must skip the locale rewrite and must not Set-Cookie, or Vercel will not CDN-cache them.
 */
export function isLocalePrefixedPilgrimagePath(pathname: string): boolean {
  const { locale, pathname: inner } = parseLocaleFromPathname(pathname);
  if (!locale) return false;
  return inner === "/pilgrimage" || inner.startsWith("/pilgrimage/");
}
