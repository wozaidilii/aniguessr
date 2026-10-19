/**
 * Single canonical origin for sitemap, robots, canonical, hreflang, and Open Graph.
 * Override with NEXT_PUBLIC_SITE_URL. The legacy-host redirect uses this same value.
 */
export const DEFAULT_SITE_URL = "https://aniguessr.ayiora.com";

/** Previous production host. Requests are 301'd to the canonical origin. */
export const LEGACY_SITE_HOSTS = ["aniguessr.loamly.net"] as const;

export const BRAND_NAME = "AniGuessr by Ayiora";

export const AYIORA_ORGANIZATION = {
  name: "Ayiora",
  url: "https://ayiora.com",
} as const;

export function normalizeSiteUrl(
  raw: string | undefined | null,
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(
  raw: string | undefined | null = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  return normalizeSiteUrl(raw) ?? DEFAULT_SITE_URL;
}

export function isLegacySiteHost(host: string | null | undefined): boolean {
  const normalized = host?.split(",")[0]?.trim().toLowerCase().split(":")[0];
  if (!normalized) return false;
  return (LEGACY_SITE_HOSTS as readonly string[]).includes(normalized);
}

/** Absolute URL on the canonical origin, or null when this host should stay. */
export function legacyHostRedirectUrl(
  host: string | null | undefined,
  pathname: string,
  search = "",
  siteUrl = resolveSiteUrl(),
): string | null {
  if (!isLegacySiteHost(host)) return null;
  const normalizedHost = host
    ?.split(",")[0]
    ?.trim()
    .toLowerCase()
    .split(":")[0];
  let siteHost = "";
  try {
    siteHost = new URL(siteUrl).host.toLowerCase();
  } catch {
    return null;
  }
  if (normalizedHost === siteHost) return null;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(`${path}${search}`, siteUrl).toString();
}
