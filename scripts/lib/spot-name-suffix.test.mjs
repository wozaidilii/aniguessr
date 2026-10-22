import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities } from "./japan-area.mjs";
import { encodeSpotId, slugifyAnime } from "../../src/lib/pilgrimage-slug.ts";
import {
  auditSpotNameSuffixes,
  auditStoredAreas,
  buildAdminIndex,
  classifyPoint,
  parseTrailingAdmin,
  rewriteAdminSuffix,
} from "./spot-name-suffix.mjs";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);

loadMunicipalities(AREA_PATH);

describe("spot name municipality suffixes", () => {
  it("keeps spot and area URLs independent of the display name", () => {
    const id = "anitabi_37137_4slhba842";
    const after = rewriteAdminSuffix(
      "来夏と紗羽が休憩していたカフェ（鎌倉市）",
      "藤沢市",
    );
    expect(after).toBe("来夏と紗羽が休憩していたカフェ（藤沢市）");
    expect(encodeSpotId(id)).toBe(id);
    expect(slugifyAnime("37137", "TARI TARI")).toBe("37137-tari-tari");
    expect(slugifyAnime("37137", "TARI TARI")).not.toBe(
      slugifyAnime("37137", after),
    );
    const build = readFileSync("scripts/build-pilgrimage-seo-data.mjs", "utf8");
    expect(build).toContain("/pilgrimage/spots/${encodeURIComponent(spot.id)}");
    expect(build).toContain("locationSlug: item.area.slug");
    expect(build).toContain("pathsForRenamedSpots");
    expect(build).not.toContain("slugifyLocation(");
  });

  it("corrects a clear interior and leaves a border", () => {
    const cafe = classifyPoint(139.4787, 35.2992);
    expect(cafe.status).toBe("clear");
    expect(cafe.place?.ja).toBe("藤沢市");
    expect(cafe.borderMeters).toBeGreaterThan(1000);
    const border = classifyPoint(139.6751, 35.5856);
    expect(border.status).toBe("border");
    expect(border.borderMeters).toBeLessThanOrEqual(1000);
    const parsed = parseTrailingAdmin("桜坂（東京都世田谷区）");
    expect(parsed?.inner).toBe("東京都世田谷区");
  });

  it("rewrites only clear suffixes and does not move area membership", () => {
    const payload = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
    const admin = buildAdminIndex(loadMunicipalities(AREA_PATH).places);
    const names = auditSpotNameSuffixes(payload.questions, admin);
    const areas = auditStoredAreas(payload.questions, admin);
    expect(names.fixes).toEqual([]);
    expect(areas.membership).toEqual([]);
    const cafe = payload.questions.find(
      (question) => question.id === "anitabi_37137_4slhba842",
    );
    expect(cafe.answerName).toBe("来夏和纱羽休息的咖啡店（藤泽市）");
    expect(cafe.locales.ja.answerName).toBe(
      "来夏と紗羽が休憩していたカフェ（藤沢市）",
    );
    expect(cafe.locales.en.answerName).toBe(
      "Café where Konatsu and Sawa rest (Fujisawa)",
    );
    expect(cafe.location).toBe("镰仓市");
    const hill = payload.questions.find(
      (question) => question.id === "anitabi_215158_51i53xhdb",
    );
    expect(hill.locales.ja.answerName).toBe("山二つ（藤沢市）");
    const sakura = payload.questions.find(
      (question) => question.id === "anitabi_51_5c4dgq9v8",
    );
    expect(sakura.locales.ja.answerName).toContain("世田谷区");
    const report = JSON.parse(
      readFileSync("scripts/data/spot-name-suffix-fixes.json", "utf8"),
    );
    expect(report.names.corrected).toBe(397);
    expect(report.names.spots).toBe(200);
    expect(report.areas.membershipWouldChange).toBe(0);
    expect(report.areas.changedMembership).toBe(false);
    expect(report.pages.spots).toHaveLength(200);
    expect(report.pages.areas.length).toBeGreaterThan(0);
    expect(report.pages.animes.length).toBeGreaterThan(0);
  });
});
