import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  formatSamePlaceGroupsCsv,
  SAME_PLACE_GROUPS_CSV,
  buildSamePlaceGroupRows,
} from "~/lib/same-place-groups";
import { parseNavCatalog } from "~/lib/pilgrimage-nav";

const catalog = parseNavCatalog(
  JSON.parse(
    readFileSync(path.join("public", "data", "seo", "spots-nav.json"), "utf8"),
  ),
);
const csv = formatSamePlaceGroupsCsv(buildSamePlaceGroupRows(catalog));
writeFileSync(SAME_PLACE_GROUPS_CSV, csv);
const rows = csv.trim().split("\n").length - 1;
process.stdout.write(`wrote ${rows} groups to ${SAME_PLACE_GROUPS_CSV}\n`);
