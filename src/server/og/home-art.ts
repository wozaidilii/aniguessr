import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import type { HomeLocale } from "~/lib/home-locale";
import { homeOgStaticName } from "~/lib/og/metadata";

/**
 * Absolute path of the designer's homepage artwork.
 * `public/og/home-{locale}.png` is the public og:image when this file exists.
 */
export function homeOgStaticFile(locale: HomeLocale): string {
  return path.join(process.cwd(), "public", "og", homeOgStaticName(locale));
}

export function homeOgStaticExists(locale: HomeLocale): boolean {
  return existsSync(homeOgStaticFile(locale));
}
