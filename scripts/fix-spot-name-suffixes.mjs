import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadMunicipalities } from "./lib/japan-area.mjs";
import {
  BORDER_METERS,
  applyNameFixes,
  auditSpotNameSuffixes,
  auditStoredAreas,
  buildAdminIndex,
} from "./lib/spot-name-suffix.mjs";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);
const REPORT_PATH = path.join(
  process.cwd(),
  "scripts/data/spot-name-suffix-fixes.json",
);

const apply = process.argv.includes("--apply");
const payload = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
const questions = Array.isArray(payload.questions) ? payload.questions : [];
const { places } = loadMunicipalities(AREA_PATH);
const adminIndex = buildAdminIndex(places);
const names = auditSpotNameSuffixes(questions, adminIndex);
const areas = auditStoredAreas(questions, adminIndex);

const indexPath = path.join(process.cwd(), "public/data/seo/index.json");
let seoSpots = {};
try {
  seoSpots = JSON.parse(readFileSync(indexPath, "utf8")).spots ?? {};
} catch {
  seoSpots = {};
}
const spotPages = new Set();
const areaPages = new Set();
const animePages = new Set();
for (const fix of names.fixes) {
  spotPages.add(`/pilgrimage/spots/${encodeURIComponent(fix.id)}`);
  const seo = seoSpots[fix.id];
  const area = seo?.locationSlug || fix.locationSlug;
  if (area) areaPages.add(`/pilgrimage/locations/${area}`);
  if (seo?.subjectSlug) animePages.add(`/pilgrimage/anime/${seo.subjectSlug}`);
}

const exampleIds = [
  "anitabi_37137_4slhba842",
  "anitabi_215158_51i53xhdb",
  "anitabi_51_sww4zc3ji",
  "anitabi_234_5z3hugd",
];
const examples = [];
for (const id of exampleIds) {
  for (const locale of ["ja", "zh", "en"]) {
    const fix = names.fixes.find(
      (row) => row.id === id && row.locale === locale,
    );
    if (fix) examples.push(fix);
  }
}
for (const fix of names.fixes) {
  if (examples.length >= 10) break;
  if (examples.some((row) => row.id === fix.id && row.locale === fix.locale))
    continue;
  examples.push(fix);
}

const report = {
  correctedOn: "2026-10-21",
  borderMeters: BORDER_METERS,
  urls: {
    spotPath: "/pilgrimage/spots/${encodeURIComponent(id)}",
    areaPath: "/pilgrimage/locations/${locationSlug}",
    animePath: "/pilgrimage/anime/${subjectSlug}",
    nameChangesSpotSlug: false,
    nameChangesAreaSlug: false,
    membershipChanged: false,
  },
  names: {
    suffixed: names.suffixed,
    corrected: names.fixes.length,
    spots: spotPages.size,
    left: names.left.length,
    leftByReason: names.left.reduce((counts, row) => {
      counts[row.reason] = (counts[row.reason] ?? 0) + 1;
      return counts;
    }, {}),
    examples: examples.slice(0, 10).map((fix) => ({
      id: fix.id,
      locale: fix.locale,
      from: fix.from,
      to: fix.to,
      municipality: fix.municipality,
      borderMeters: fix.borderMeters,
    })),
    fixes: names.fixes,
    leftRows: names.left,
  },
  pages: {
    spots: [...spotPages].sort(),
    areas: [...areaPages].sort(),
    animes: [...animePages].sort(),
  },
  areas: {
    changedMembership: false,
    labelMismatches: areas.labelMismatches.length,
    membershipWouldChange: areas.membership.length,
    affectedAreaPages: areas.membership.map((row) => ({
      from: `/pilgrimage/locations/${row.fromSlug}`,
      to: `/pilgrimage/locations/${row.toSlug}`,
      id: row.id,
    })),
    labelExamples: areas.labelMismatches.slice(0, 10),
  },
};

console.log(
  JSON.stringify(
    {
      suffixed: report.names.suffixed,
      corrected: report.names.corrected,
      spots: report.names.spots,
      left: report.names.left,
      leftByReason: report.names.leftByReason,
      examples: report.names.examples,
      labelMismatches: report.areas.labelMismatches,
      membershipWouldChange: report.areas.membershipWouldChange,
      areaPages: report.pages.areas.length,
      animePages: report.pages.animes.length,
    },
    null,
    2,
  ),
);

if (!apply) {
  console.log("dry-run");
  process.exit(0);
}

const applied = applyNameFixes(questions, names.fixes);
if (applied !== names.fixes.length) {
  console.error(`applied ${applied} of ${names.fixes.length}`);
  process.exit(1);
}
writeFileSync(QUESTIONS_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(`wrote ${applied} name suffixes`);
console.log(`area pages with a renamed spot: ${report.pages.areas.length}`);
console.log(`anime pages with a renamed spot: ${report.pages.animes.length}`);
