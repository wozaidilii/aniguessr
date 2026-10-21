import knownSlugs from "~/lib/pilgrimage-known-slugs.json";
import {
  splitLocalePath,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";

const animeSlugs = new Set(knownSlugs.anime);
const locationSlugs = new Set(knownSlugs.location);

export function notFoundShellPath(locale: PilgrimageLocale): string {
  return `/not-found-shell/${locale}`;
}

/** Game, battle, and account routes still live outside the locale tree. */
export function isLocaleAppRoute(innerPath: string): boolean {
  return (
    innerPath === "/game" ||
    innerPath.startsWith("/game/") ||
    innerPath === "/battle" ||
    innerPath.startsWith("/battle/") ||
    innerPath === "/login" ||
    innerPath === "/profile" ||
    innerPath === "/onboarding" ||
    innerPath === "/character" ||
    innerPath === "/api" ||
    innerPath.startsWith("/api/")
  );
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Unknown work and area URLs must not reach Next's empty not-found shell.
 * A known slug returns null so the real page can render.
 */
export function missingPilgrimageShell(pathname: string): string | null {
  const { locale, pathname: inner } = splitLocalePath(pathname);
  if (!locale) return null;
  const anime = /^\/pilgrimage\/anime\/([^/]+)\/?$/u.exec(inner);
  const animeSlug = anime?.[1];
  if (animeSlug) {
    return animeSlugs.has(decodeSegment(animeSlug))
      ? null
      : notFoundShellPath(locale);
  }
  const location = /^\/pilgrimage\/locations\/([^/]+)\/?$/u.exec(inner);
  const locationSlug = location?.[1];
  if (locationSlug) {
    return locationSlugs.has(decodeSegment(locationSlug))
      ? null
      : notFoundShellPath(locale);
  }
  return null;
}

/** Drop the client runtime so a 404 document cannot hydrate into the empty error shell. */
export function freezeNotFoundDocument(html: string): string {
  return html
    .replace(/<link\b[^>]*rel="preload"[^>]*as="script"[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "");
}
