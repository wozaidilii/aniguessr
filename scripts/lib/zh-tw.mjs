import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";

const overrides = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../data/zh-tw-overrides.json",
    ),
    "utf8",
  ),
);

/** Longest simplified phrase first, so 镰仓市 wins over 镰仓. */
const overrideKeys = Object.keys(overrides).sort(
  (left, right) => right.length - left.length,
);

const converter = OpenCC.Converter({ from: "cn", to: "twp" });

/**
 * Simplified Chinese → Traditional Chinese with Taiwan phrasing (OpenCC s2twp).
 * Manual fixes in scripts/data/zh-tw-overrides.json are applied first and
 * then left alone, because s2twp does not rewrite characters that are already traditional.
 */
export function toZhTw(value) {
  const source = typeof value === "string" ? value : "";
  let text = source;
  for (const key of overrideKeys) {
    if (!text.includes(key)) continue;
    text = text.replaceAll(key, overrides[key]);
  }
  return converter(text);
}
