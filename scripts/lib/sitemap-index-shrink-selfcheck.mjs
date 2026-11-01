/**
 * Optional self-check against expected-sitemap-after.json (array of [path, lastmod]).
 * Usage: node scripts/lib/sitemap-index-shrink-selfcheck.mjs [path-to-expected.json]
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { SITEMAP_INDEX_SHRINK_LASTMOD } from "./index-quality.mjs";

const expectedPath =
  process.argv[2] ??
  path.join(process.cwd(), "data/index-quality/expected-sitemap-after.json");

function locPath(loc) {
  return new URL(loc).pathname;
}

function loadGenerated() {
  const map = new Map();
  const dir = path.join(process.cwd(), "public/sitemaps");
  const pattern =
    /<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/gu;
  for (const file of readdirSync(dir)) {
    if (!/^\d+\.xml$/u.test(file)) continue;
    const xml = readFileSync(path.join(dir, file), "utf8");
    for (const match of xml.matchAll(pattern)) {
      const route = locPath(match[1]);
      if (!map.has(route)) map.set(route, match[2]);
    }
  }
  return map;
}

function loadExpected(raw) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("expected file must be a JSON array of [path, lastmod]");
  }
  const map = new Map();
  for (const row of parsed) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const lastmod = row[1] === "NEW" ? SITEMAP_INDEX_SHRINK_LASTMOD : row[1];
    map.set(row[0], lastmod);
  }
  return map;
}

const generated = loadGenerated();
const expected = loadExpected(readFileSync(expectedPath, "utf8"));
let missingInGenerated = 0;
let missingInExpected = 0;
let lastmodMismatch = 0;
for (const [route, lastmod] of expected) {
  if (!generated.has(route)) missingInGenerated += 1;
  else if (generated.get(route) !== lastmod) lastmodMismatch += 1;
}
for (const route of generated.keys()) {
  if (!expected.has(route)) missingInExpected += 1;
}
const summary = {
  generatedUrls: generated.size,
  expectedUrls: expected.size,
  missingInGenerated,
  missingInExpected,
  lastmodMismatch,
};
console.log(JSON.stringify(summary, null, 2));
if (
  missingInGenerated ||
  missingInExpected ||
  lastmodMismatch
) {
  process.exit(1);
}
