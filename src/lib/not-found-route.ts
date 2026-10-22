import { isKnownSpotId } from "~/lib/known-spot-id";
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
  const spot = /^\/pilgrimage\/spots\/([^/]+)\/?$/u.exec(inner);
  const spotId = spot?.[1];
  if (spotId) {
    return isKnownSpotId(decodeSegment(spotId))
      ? null
      : notFoundShellPath(locale);
  }
  return null;
}

const ROBOTS_META =
  /<meta\b[^>]*\bname=["'](?:robots|googlebot)["'][^>]*>/gi;

/**
 * Drop the client runtime so a 404 document cannot hydrate into the empty
 * error shell, and leave exactly one robots meta: noindex.
 */
export function freezeNotFoundDocument(html: string): string {
  const stripped = html
    .replace(/<link\b[^>]*rel="preload"[^>]*as="script"[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(ROBOTS_META, "");
  const meta = '<meta name="robots" content="noindex"/>';
  if (stripped.includes("</head>")) {
    return stripped.replace("</head>", `${meta}</head>`);
  }
  return `${meta}${stripped}`;
}
