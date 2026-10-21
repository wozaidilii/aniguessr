/**
 * Compare stored anime-question location labels with offline MLIT
 * municipality polygons (scripts/data/japan-municipalities.json).
 *
 *   node scripts/fix-question-locations.mjs            # print the audit
 *   node scripts/fix-question-locations.mjs --write    # write the migration and patch labels
 *
 * A label is rewritten only when the point is clearly inside one prefecture
 * and that prefecture is not the prefecture named by the stored label.
 * Outside Japan, border, and ambiguous points are left unchanged.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadMunicipalities } from "./lib/japan-area.mjs";
import {
  auditQuestionLocations,
  buildLabelIndex,
} from "./lib/question-location-audit.mjs";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);
const MIGRATION_PATH = path.join(
  process.cwd(),
  "scripts/data/question-location-fixes.json",
);

function loadQuestions() {
  const raw = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  if (!Array.isArray(raw.questions)) throw new Error("questions array missing");
  return raw.questions;
}

function printReport(audit) {
  const totals = {
    questions: 0,
    match: 0,
    municipalityMismatch: 0,
    prefectureMismatch: 0,
    outside: 0,
    border: 0,
    ambiguous: 0,
    unresolved: 0,
  };
  for (const row of audit.labels) {
    for (const key of Object.keys(totals)) totals[key] += row[key] ?? 0;
  }
  console.log(JSON.stringify({ totals, fixes: audit.fixes.length, unchanged: audit.unchanged.length }, null, 2));
  console.log("per label (prefecture mismatches first):");
  for (const row of audit.labels) {
    if (
      row.prefectureMismatch === 0 &&
      row.municipalityMismatch === 0 &&
      row.outside === 0 &&
      row.border === 0 &&
      row.ambiguous === 0
    ) {
      continue;
    }
    console.log(
      [
        row.label,
        `n=${row.questions}`,
        `pref=${row.prefectureMismatch}`,
        `muni=${row.municipalityMismatch}`,
        `match=${row.match}`,
        `out=${row.outside}`,
        `border=${row.border}`,
        `amb=${row.ambiguous}`,
        `unres=${row.unresolved}`,
      ].join(" "),
    );
  }
}

function applyFixes(fixes) {
  const pending = new Map(fixes.map((fix) => [fix.id, fix]));
  const text = readFileSync(QUESTIONS_PATH, "utf8");
  const parts = [];
  let cursor = 0;
  const ids = /"id": "([^"]+)"/g;
  for (const match of text.matchAll(ids)) {
    const fix = pending.get(match[1]);
    if (!fix) continue;
    if (/["\\]/u.test(fix.to)) throw new Error(`unsafe label ${fix.to}`);
    const nextId = text.indexOf('"id": "', match.index + match[0].length);
    const end = nextId < 0 ? text.length : nextId;
    const block = text.slice(match.index, end);
    const field = `"location": "${fix.from}"`;
    const at = block.indexOf(field);
    if (at < 0) throw new Error(`${fix.id} has no location ${fix.from}`);
    parts.push(text.slice(cursor, match.index + at));
    parts.push(`"location": "${fix.to}"`);
    cursor = match.index + at + field.length;
    pending.delete(match[1]);
  }
  if (pending.size > 0) {
    throw new Error(`unapplied fixes: ${[...pending.keys()].slice(0, 5).join(", ")}`);
  }
  parts.push(text.slice(cursor));
  writeFileSync(QUESTIONS_PATH, parts.join(""));
}

const write = process.argv.includes("--write");
const index = loadMunicipalities(AREA_PATH);
const questions = loadQuestions();
const audit = auditQuestionLocations(questions, buildLabelIndex(index.places));
printReport(audit);

if (write) {
  const totals = {
    questions: 0,
    match: 0,
    municipalityMismatch: 0,
    prefectureMismatch: 0,
    outside: 0,
    border: 0,
    ambiguous: 0,
    unresolved: 0,
  };
  for (const row of audit.labels) {
    for (const key of Object.keys(totals)) totals[key] += row[key] ?? 0;
  }
  const migration = {
    source: "scripts/data/japan-municipalities.json",
    boundary:
      "国土数値情報 行政区域 (MLIT), simplified polygons in japan-municipalities.json",
    rule: "Rewrite the stored label only when the point is more than 1km inside a single prefecture that is not the stored label's prefecture. Same-prefecture municipality differences, outside Japan, borders, and ambiguous points stay as stored.",
    totals,
    perLabel: audit.labels.filter(
      (row) =>
        row.prefectureMismatch > 0 ||
        row.municipalityMismatch > 0 ||
        row.outside > 0 ||
        row.border > 0 ||
        row.ambiguous > 0,
    ),
    fixes: audit.fixes,
    unchanged: audit.unchanged,
  };
  writeFileSync(MIGRATION_PATH, `${JSON.stringify(migration, null, 2)}\n`);
  applyFixes(audit.fixes);
  console.log(`wrote ${audit.fixes.length} fixes to ${MIGRATION_PATH}`);
}
