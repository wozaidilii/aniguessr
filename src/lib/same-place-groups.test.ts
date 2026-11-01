import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SAME_PLACE_GROUPS_CSV,
  buildSamePlaceGroupRows,
  formatSamePlaceGroupsCsv,
  parseSamePlaceGroupsCsv,
} from "~/lib/same-place-groups";
import { parseNavCatalog } from "~/lib/pilgrimage-nav";

describe("same-place group export", () => {
  it("matches the committed CSV and keeps page wiring", () => {
    const catalog = parseNavCatalog(
      JSON.parse(readFileSync("public/data/seo/spots-nav.json", "utf8")),
    );
    const rows = buildSamePlaceGroupRows(catalog);
    const csv = readFileSync(SAME_PLACE_GROUPS_CSV, "utf8");
    expect(csv).toBe(formatSamePlaceGroupsCsv(rows));
    expect(rows.length).toBeGreaterThan(0);
    const parsed = parseSamePlaceGroupsCsv(csv);
    expect(parsed).toHaveLength(rows.length);
    const page = readFileSync(
      "src/app/[locale]/pilgrimage/spots/[id]/page.tsx",
      "utf8",
    );
    expect(page).toContain("<a");
    expect(page).toContain("samePlaceWorks");
    expect(page).toContain("samePlaceSiblings");
    expect(page).toContain("whitespace-nowrap");
    expect(page).not.toContain("samePlaceAlso");
    expect(page).not.toContain("permanentRedirect(samePlace");
  });
});
