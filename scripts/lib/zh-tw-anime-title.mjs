import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toZhTw } from "./zh-tw.mjs";

const titleMap = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../data/zh-tw-anime-titles.json",
    ),
    "utf8",
  ),
);

/**
 * zh-TW anime title, chosen at SEO build time.
 * explicit `tw` > manual override map > OpenCC s2twp of simplified `zh` > ja.
 * Slugs stay on the simplified title. This module is not imported by the client.
 * @param {string | Array<string | undefined>} subjectIds canonical id first
 * @param {{ tw?: string, ja?: string, zh?: string } | null | undefined} titles
 * @param {Record<string, string>} [map]
 */
export function zhTwAnimeTitle(subjectIds, titles, map = titleMap) {
  const explicit = typeof titles?.tw === "string" ? titles.tw.trim() : "";
  if (explicit) return { text: explicit, source: "explicit" };

  const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
  for (const id of ids) {
    if (!id) continue;
    const override = map[String(id)];
    if (typeof override === "string" && override.trim()) {
      return { text: override.trim(), source: "override" };
    }
  }

  const zh = typeof titles?.zh === "string" ? titles.zh.trim() : "";
  if (zh) {
    const converted = toZhTw(zh).trim();
    if (converted) return { text: converted, source: "opencc" };
  }

  const ja = typeof titles?.ja === "string" ? titles.ja.trim() : "";
  return { text: ja, source: "ja" };
}
