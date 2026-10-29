import { withAnimeLocale } from "~/lib/anime-locale";
import type { AnimeLocale } from "~/lib/anime-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export const HOME_LOCALES = ["ja", "zh", "en", "zh-tw"] as const;
export type HomeLocale = (typeof HOME_LOCALES)[number];

export function isHomeLocale(value: string): value is HomeLocale {
  return (HOME_LOCALES as readonly string[]).includes(value);
}

/** Battle stays on zh/ja/en. Home, pilgrimage, and the anime game keep zh-tw. */
export function homeSiteLocale(locale: HomeLocale): AnimeLocale {
  return locale === "zh-tw" ? "zh" : locale;
}

/** Relative same-origin paths only; blocks open redirects and protocol-relative URLs. */
export function sanitizeSameOriginReturnPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  if (/[\0\\]/.test(path)) return fallback;
  return path;
}

/**
 * Login target for the home header account slot.
 * zh-tw uses /zh-tw/login (served by middleware without Set-Cookie on the public shell).
 */
export function homeLoginHref(
  locale: HomeLocale,
  returnPath?: string | null,
): string {
  const home = withPilgrimageLocale("/", locale);
  const next = sanitizeSameOriginReturnPath(returnPath, home);
  const loginPath =
    locale === "zh-tw"
      ? withPilgrimageLocale("/login", "zh-tw")
      : withAnimeLocale("/login", locale);
  if (next !== home && next !== loginPath) {
    return `${loginPath}?next=${encodeURIComponent(next)}`;
  }
  return loginPath;
}
