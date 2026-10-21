import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SAME_PLACE_GROUPS_CSV,
  buildSamePlaceGroupRows,
  formatSamePlaceGroupsCsv,
  parseSamePlaceGroupsCsv,
  samePlacePeerIds,
} from "~/lib/same-place-groups";
import { parseNavCatalog } from "~/lib/pilgrimage-nav";

const ENOSHIMA_IDS = [
  "anitabi_212278_3aa8nhf3",
  "anitabi_215158_51i53xhbx",
  "anitabi_215158_51i53xo8n",
  "anitabi_321885_csisxbghx",
];

describe("same-place group export", () => {
  it("matches the committed CSV and keeps existing spot ids", () => {
    const catalog = parseNavCatalog(
      JSON.parse(readFileSync("public/data/seo/spots-nav.json", "utf8")),
    );
    const rows = buildSamePlaceGroupRows(catalog);
    const csv = readFileSync(SAME_PLACE_GROUPS_CSV, "utf8");
    expect(csv).toBe(formatSamePlaceGroupsCsv(rows));
    expect(rows).toHaveLength(1662);
    const enoshima = rows.find((row) =>
      row.spotIds.includes("anitabi_215158_51i53xo8n"),
    );
    expect(enoshima?.spotIds).toEqual(ENOSHIMA_IDS);
    expect(enoshima?.maxDistanceM).toBeLessThanOrEqual(30);
    expect(enoshima?.works).toContain("チェンソーマン");
    expect(samePlacePeerIds("anitabi_215158_51i53xo8n").sort()).toEqual(
      ENOSHIMA_IDS.filter((id) => id !== "anitabi_215158_51i53xo8n"),
    );
    const page = readFileSync(
      "src/app/[locale]/pilgrimage/spots/[id]/page.tsx",
      "utf8",
    );
    expect(page).toContain("<a");
    expect(page).toContain("samePlaceAlso");
    expect(page).not.toContain("permanentRedirect(samePlace");
    const parsed = parseSamePlaceGroupsCsv(csv);
    expect(parsed).toHaveLength(1662);
  });
});
