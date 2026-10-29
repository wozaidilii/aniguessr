import { HOME_LANG_LINKS } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { splitLocalePath, withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export interface SiteNavLink {
  id: "anime" | "areas" | "planner" | "game" | "rank";
  href: string;
}

export interface SiteNavLanguage {
  locale: HomeLocale;
  label: string;
  href: string;
}

/** Keep a planner preview when changing language; other pages keep their normal locale links. */
export function plannerLocaleSuffix(
  pathname: string,
  search: string,
  hash: string,
): string {
  if (splitLocalePath(pathname).pathname !== "/pilgrimage/planner") return "";
  const source = new URLSearchParams(search);
  const params = new URLSearchParams();
  for (const key of ["anime", "spot", "area"]) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  return `${params.size ? `?${params.toString()}` : ""}${hash.startsWith("#trip=") ? hash : ""}`;
}

/** Shared header targets. Logo always returns to /{locale}. Game and rank stay on the homepage hash. */
export function siteNavModel(
  pathname: string,
  locale: HomeLocale,
): {
  home: string;
  links: SiteNavLink[];
  languages: SiteNavLanguage[];
} {
  const inner = splitLocalePath(pathname).pathname;
  const home = withPilgrimageLocale("/", locale);
  const onHome = inner === "/";
  return {
    home,
    links: [
      { id: "anime", href: withPilgrimageLocale("/pilgrimage/anime", locale) },
      {
        id: "areas",
        href: withPilgrimageLocale("/pilgrimage/locations", locale),
      },
      {
        id: "planner",
        href: withPilgrimageLocale("/pilgrimage/planner", locale),
      },
      { id: "game", href: onHome ? "#game" : `${home}#game` },
      { id: "rank", href: onHome ? "#rank" : `${home}#rank` },
    ],
    languages: HOME_LANG_LINKS.map((item) => ({
      locale: item.locale,
      label: item.label,
      href: withPilgrimageLocale(inner, item.locale),
    })),
  };
}

/** Map is only the hub and spot pages. Anime and area links own their subtrees. */
export function siteNavIsCurrent(pathname: string, href: string): boolean {
  if (href.startsWith("#")) return false;
  const path = href.split("#")[0] ?? "";
  if (!path) return false;
  if (path.endsWith("/pilgrimage")) {
    return pathname === path || pathname.startsWith(`${path}/spots`);
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
