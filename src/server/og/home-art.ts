import "server-only";

import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import type { HomeLocale } from "~/lib/home-locale";
import { homeOgStaticName } from "~/lib/og/metadata";

/**
 * Absolute path of the designer's homepage artwork.
 * `public/og/home-{locale}.png` wins over the generated map card.
 */
export function homeOgStaticFile(locale: HomeLocale): string {
  return path.join(process.cwd(), "public", "og", homeOgStaticName(locale));
}

/** Null when the static file is absent. Otherwise a short content stamp for `?v=`. */
export function homeOgStaticStamp(locale: HomeLocale): string | null {
  const file = homeOgStaticFile(locale);
  if (!existsSync(file)) return null;
  const stat = statSync(file);
  return createHash("sha256")
    .update(`${stat.size}\0${Math.round(stat.mtimeMs)}`)
    .digest("base64url")
    .slice(0, 12);
}
