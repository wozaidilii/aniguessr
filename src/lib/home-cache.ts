import { splitLocalePath } from "~/lib/pilgrimage-locale";

/**
 * Exact homepage URLs: /ja, /zh, /en, /zh-tw.
 * These must skip the locale rewrite and must not Set-Cookie, or the CDN
 * will not cache the ISR HTML.
 */
export function isLocaleHomePath(pathname: string): boolean {
  const { locale, pathname: inner } = splitLocalePath(pathname);
  if (!locale) return false;
  return inner === "/";
}
