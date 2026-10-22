import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities } from "./japan-area.mjs";
import {
  auditQuestionLocations,
  buildLabelIndex,
  classifyCoordinate,
  labelForMunicipality,
  resolveStoredLabel,
} from "./question-location-audit.mjs";

const AREA_PATH = path.join(process.cwd(), "scripts/data/japan-municipalities.json");
const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const MIGRATION_PATH = path.join(
  process.cwd(),
  "scripts/data/question-location-fixes.json",
);

const index = loadMunicipalities(AREA_PATH);
const byLabel = buildLabelIndex(index.places);

describe("stored location labels against MLIT boundaries", () => {
  it("uses the question bank's short simplified names", () => {
    expect(labelForMunicipality({ code: "13113", zh: "东京都涩谷区" })).toBe("涩谷区");
    expect(labelForMunicipality({ code: "12106", zh: "千葉市美浜区" })).toBe("千叶市");
    expect(labelForMunicipality({ code: "26101", zh: "京都市北区" })).toBe("京都市");
    expect(labelForMunicipality({ code: "25212", zh: "犬上郡豊鄕町" })).toBe("丰乡町");
    expect(labelForMunicipality({ code: "13381", zh: "三宅支厅三宅村" })).toBe("三宅村");
    expect(labelForMunicipality({ code: "14204", zh: "鎌倉市" })).toBe("镰仓市");
  });

  it("places the Makuhari point in Chiba, not Kyoto", () => {
    const place = classifyCoordinate(140.0457, 35.6442);
    expect(place).toMatchObject({
      status: "clear",
      pref: "12",
      label: "千叶市",
    });
  });

  it("keeps Kiyomizu inside Kyoto city", () => {
    const place = classifyCoordinate(135.785046, 34.994856);
    expect(place).toMatchObject({
      status: "clear",
      pref: "26",
      label: "京都市",
    });
  });

  it("leaves a coordinate in the ocean outside Japan", () => {
    expect(classifyCoordinate(0, 0).status).toBe("outside");
  });

  it("resolves bank labels to one prefecture and does not treat 日本 as a prefecture", () => {
    expect(resolveStoredLabel("京都市", byLabel)).toMatchObject({
      kind: "municipality",
      pref: "26",
    });
    expect(resolveStoredLabel("东京都", byLabel)).toMatchObject({
      kind: "prefecture",
      pref: "13",
    });
    expect(resolveStoredLabel("涩谷区", byLabel)).toMatchObject({
      kind: "municipality",
      pref: "13",
    });
    expect(resolveStoredLabel("日本", byLabel).kind).toBe("country");
  });

  it("applies only clear prefecture corrections and leaves the known question id in place", () => {
    const migration = JSON.parse(readFileSync(MIGRATION_PATH, "utf8"));
    const makuhari = migration.fixes.find(
      (fix) => fix.id === "anitabi_102134_9xs0myq",
    );
    expect(makuhari).toMatchObject({
      from: "京都市",
      to: "千叶市",
      fromPrefecture: "京都府",
      toPrefecture: "千叶县",
    });
    expect(migration.fixes.every((fix) => fix.from !== "日本")).toBe(true);
    expect(migration.fixes.every((fix) => fix.id && fix.from !== fix.to)).toBe(true);
    expect(
      migration.unchanged.every((row) =>
        ["outside", "border", "ambiguous", "ambiguous-label"].includes(row.reason),
      ),
    ).toBe(true);

    const kyoto = migration.perLabel.find((row) => row.label === "京都市");
    expect(kyoto.prefectureMismatch).toBeGreaterThan(100);
    expect(migration.totals.prefectureMismatch).toBe(migration.fixes.length);

    const text = readFileSync(QUESTIONS_PATH, "utf8");
    const at = text.indexOf('"id": "anitabi_102134_9xs0myq"');
    const block = text.slice(at, text.indexOf('"id": "', at + 10));
    expect(block).toContain('"location": "千叶市"');
    expect(block).not.toContain('"location": "京都市"');
    expect(block).toContain("anitabi_102134_9xs0myq");
  });

  it("is idempotent after the migration is applied", () => {
    const questions = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8")).questions;
    const again = auditQuestionLocations(questions, byLabel);
    expect(again.fixes).toEqual([]);
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("anitabi_102134_9xs0myq");
  });
});
