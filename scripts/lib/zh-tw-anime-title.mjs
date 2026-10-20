import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
 * zh-TW anime title. Official Taiwan titles win. Otherwise the Japanese title.
 * Simplified text is never converted and never used as a fallback.
 * @param {string | Array<string | undefined>} subjectIds canonical id first
 * @param {{ ja?: string, zh?: string } | null | undefined} titles
 * @param {Record<string, string>} [map]
 */
export function zhTwAnimeTitle(subjectIds, titles, map = titleMap) {
  const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
  for (const id of ids) {
    if (!id) continue;
    const official = map[String(id)];
    if (typeof official === "string" && official.trim()) {
      return { text: official.trim(), source: "official-title" };
    }
  }
  const ja = typeof titles?.ja === "string" ? titles.ja.trim() : "";
  return { text: ja, source: "ja-fallback" };
}
