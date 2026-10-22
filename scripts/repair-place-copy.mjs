/**
 * Restore #33 place-copy text to the ba56b61 wording recorded in
 * scripts/data/spot-copy-edits.json, then re-apply only the strict allowlist.
 *
 *   node scripts/repair-place-copy.mjs
 *   node scripts/repair-place-copy.mjs --apply
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadMunicipalities,
  locateMunicipality,
  municipalitiesContaining,
} from "./lib/japan-area.mjs";
import {
  buildGazetteer,
  fieldKind,
  fieldLocale,
  readField,
  staleLocationTokens,
  strictRewrite,
  writeField,
} from "./lib/strict-place-copy.mjs";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const EDITS_PATH = path.join(process.cwd(), "scripts/data/spot-copy-edits.json");
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);
const REVIEW_PATH = path.join(
  process.cwd(),
  "scripts/data/stale-place-copy-review.json",
);

/** Hand-checked: 弁天橋 is in Fujisawa, and no Enoden track runs on it. */
export const BENTEN_FUNFACTS = [
  {
    id: "anitabi_364252_jsf4ib19d",
    fields: {
      "locales.ja.funfact[0]":
        "この橋は藤沢市にあり、江ノ島と湘南海岸を結ぶ歩行者用の橋です。",
      "funfact[0]": "该桥位于藤泽市，是连接江之岛与湘南海岸的人行桥。",
      "locales.en.funfact[0]":
        "The bridge is located in Fujisawa, Kanagawa, and is a pedestrian bridge connecting Enoshima Island to the Shonan coast.",
    },
  },
  {
    id: "anitabi_337709_mqx7p4y7m",
    fields: {
      "locales.ja.funfact[0]":
        "現実の弁天橋は神奈川県藤沢市にあり、江の島と陸地を結ぶ小さな橋で、人気の散歩道です。",
      "funfact[0]":
        "现实中的弁天桥位于神奈川县藤泽市，是一座连接江之岛与陆地的小桥，也是著名的散步道。",
      "locales.en.funfact[0]":
        "The real Benten Bridge is located in Fujisawa, Kanagawa, connecting Enoshima to the mainland, and is a popular promenade.",
    },
  },
  {
    id: "anitabi_212278_3aa8nggt",
    fields: {
      "locales.ja.funfact[0]":
        "実際の弁天橋は神奈川県藤沢市にあり、川を渡る歩行者・自転車専用橋です。",
      "funfact[0]": "现实中的弁天桥位于神奈川县藤泽市，是一座跨河的人行与自行车共用桥。",
      "locales.en.funfact[0]":
        "The real Benten Bridge is located in Fujisawa, Kanagawa Prefecture, a pedestrian and bicycle bridge over the river.",
    },
  },
  {
    id: "anitabi_93739_4ybofw9tg",
    fields: {
      "locales.ja.funfact[0]":
        "この砂浜は神奈川県藤沢市の江ノ島弁天橋東側に位置し、作品内で繰り返し登場する日常シーンの舞台です。",
      "funfact[0]":
        "该场景位于神奈川县藤泽市，江之岛弁天桥东侧的沙滩，是作品中重要的日常场景之一。",
      "locales.en.funfact[0]":
        "This beach is located east of Benten Bridge in Fujisawa, Kanagawa Prefecture, and is a recurring daily-life setting in the series.",
    },
  },
  {
    id: "anitabi_240038_13er6rk",
    fields: {
      "locales.ja.funfact[0]":
        "このシーンは神奈川県藤沢市の江の島弁天橋（片瀬海岸と江の島を結ぶ橋）で撮影された。",
      "funfact[0]": "该场景取景于神奈川县藤泽市的江之岛弁天桥，连接片濑海岸与江之岛。",
      "locales.en.funfact[0]":
        "This scene was filmed at Enoshima Bentenbashi in Fujisawa, Kanagawa Prefecture, connecting Katase Coast to Enoshima Island.",
    },
  },
  {
    id: "anitabi_1733_814d6756",
    fields: {
      "locales.ja.funfact[0]":
        "実際の場所は藤沢市の江ノ島入口の鳥居、弁天橋のそばです。",
      "funfact[0]": "现实地点是藤泽市的江之岛入口鸟居，即弁天桥附近。",
      "locales.en.funfact[0]":
        "The real location is the torii at the entrance of Enoshima in Fujisawa, near Bentenbashi Bridge.",
    },
  },
  {
    id: "anitabi_240038_4z8vzooxw",
    fields: {
      "locales.ja.funfact[0]":
        "このシーンのロケ地は神奈川県藤沢市の江の島近くの片瀬海岸で、ベンチは江の島弁天橋のそばにある。",
      "funfact[0]":
        "该场景取景于神奈川县藤泽市江之岛附近的片濑海岸，长椅位于江之岛弁天桥旁。",
      "locales.en.funfact[0]":
        "The scene is modeled after the coast near Enoshima in Fujisawa, Kanagawa Prefecture; the bench is beside the Benten Bridge leading to Enoshima.",
    },
  },
];

function dropBadPrefectureStyle(text) {
  return text
    .replaceAll("Tokyo Prefecture", "Tokyo")
    .replaceAll("Hokkaido Prefecture", "Hokkaido");
}

function objectEnd(raw, braceAt) {
  let depth = 0;
  let quote = false;
  let escape = false;
  for (let index = braceAt; index < raw.length; index += 1) {
    const char = raw[index];
    if (quote) {
      if (escape) escape = false;
      else if (char === "\\") escape = true;
      else if (char === '"') quote = false;
      continue;
    }
    if (char === '"') quote = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  throw new Error("Unclosed question object");
}

function writeQuestions(raw, questions, changed) {
  const pieces = [];
  let cursor = 0;
  for (const question of questions) {
    if (!changed.has(question.id)) continue;
    const marker = `"id": ${JSON.stringify(question.id)}`;
    const at = raw.indexOf(marker, cursor);
    if (at < 0) throw new Error(`Missing ${question.id} in questions file`);
    const line = raw.lastIndexOf("\n    {", at);
    const start = line + 1;
    const brace = raw.indexOf("{", start);
    const end = objectEnd(raw, brace);
    const serialized = JSON.stringify(question, null, 2).replace(/^/gm, "    ");
    pieces.push(raw.slice(cursor, start), serialized);
    cursor = end;
  }
  pieces.push(raw.slice(cursor));
  return pieces.join("");
}

export function repairPlaceCopy({ questions, recorded, places }) {
  const gazetteer = buildGazetteer(places);
  const byId = new Map(questions.map((question) => [question.id, question]));
  const changed = new Set();
  const kept = [];
  let restored = 0;
  let reapplied = 0;
  const mismatched = [];

  for (const row of recorded.edits) {
    const question = byId.get(row.id);
    if (!question) throw new Error(`Missing question ${row.id}`);
    const current = readField(question, row.field);
    if (current !== row.to && current !== row.from) {
      mismatched.push({ id: row.id, field: row.field });
      continue;
    }
    if (current !== row.from) {
      writeField(question, row.field, row.from);
      changed.add(row.id);
      restored += 1;
    }
  }
  if (mismatched.length > 0) {
    throw new Error(
      `Copy edits do not match the questions file (${mismatched.length}), e.g. ${mismatched[0].id} ${mismatched[0].field}`,
    );
  }

  for (const row of recorded.edits) {
    if (row.hand) continue;
    const question = byId.get(row.id);
    const kind = fieldKind(row.field);
    if (kind === "blocked") continue;
    const hits = municipalitiesContaining(question.lng, question.lat);
    if (hits.length !== 1) continue;
    const place = hits[0];
    const locale = fieldLocale(row.field);
    const original = readField(question, row.field);
    if (typeof original !== "string") continue;
    const next = strictRewrite(original, place, locale, kind, gazetteer);
    if (next === original) continue;
    writeField(question, row.field, next);
    changed.add(row.id);
    reapplied += 1;
    kept.push({ id: row.id, field: row.field, from: row.from, to: next });
  }

  let styled = 0;
  for (const id of recorded.ids) {
    const question = byId.get(id);
    if (!question) continue;
    const english = question.locales?.en;
    if (!english) continue;
    for (const key of ["answerName"]) {
      const value = english[key];
      if (typeof value !== "string" || !/Tokyo Prefecture|Hokkaido Prefecture/u.test(value)) {
        continue;
      }
      english[key] = dropBadPrefectureStyle(value);
      changed.add(id);
      styled += 1;
    }
    if (Array.isArray(english.funfact)) {
      english.funfact.forEach((value, index) => {
        if (typeof value !== "string" || !/Tokyo Prefecture|Hokkaido Prefecture/u.test(value)) {
          return;
        }
        english.funfact[index] = dropBadPrefectureStyle(value);
        changed.add(id);
        styled += 1;
      });
    }
  }

  const fujisawa = places.find((place) => place.code === "14205");
  for (const fix of BENTEN_FUNFACTS) {
    const question = byId.get(fix.id);
    if (!question) throw new Error(`Missing Benten question ${fix.id}`);
    const hits = municipalitiesContaining(question.lng, question.lat);
    const located = hits.length === 1 ? hits[0] : locateMunicipality(question.lng, question.lat);
    if (located?.code !== fujisawa.code) {
      throw new Error(`${fix.id} is not inside 藤沢市`);
    }
    for (const [field, value] of Object.entries(fix.fields)) {
      const before = readField(question, field);
      if (before === value) continue;
      writeField(question, field, value);
      changed.add(fix.id);
      kept.push({ id: fix.id, field, from: before, to: value, hand: true });
    }
  }

  const review = [];
  const reviewIds = new Set();
  for (const id of recorded.ids) {
    const question = byId.get(id);
    if (!question) continue;
    const hits = municipalitiesContaining(question.lng, question.lat);
    if (hits.length !== 1) continue;
    const place = hits[0];
    const fields = [];
    for (const key of ["answerName", "description", "episodeContext", "title"]) {
      if (typeof question[key] === "string") fields.push([key, question[key], "zh"]);
      for (const locale of ["ja", "en"]) {
        const value = question.locales?.[locale]?.[key];
        if (typeof value === "string") fields.push([`locales.${locale}.${key}`, value, locale]);
      }
    }
    for (const locale of ["zh", "ja", "en"]) {
      const list =
        locale === "zh" ? question.funfact : question.locales?.[locale]?.funfact;
      if (!Array.isArray(list)) continue;
      list.forEach((value, index) => {
        if (typeof value !== "string") return;
        const field = locale === "zh" ? `funfact[${index}]` : `locales.${locale}.funfact[${index}]`;
        fields.push([field, value, locale]);
      });
    }
    for (const [field, value, locale] of fields) {
      const tokens = staleLocationTokens(value, place, locale, gazetteer);
      if (tokens.length === 0) continue;
      reviewIds.add(id);
      review.push({
        id,
        field,
        tokens,
        containing: place.ja,
        excerpt: value.slice(0, 180),
      });
    }
  }

  return {
    changed,
    restored,
    reapplied,
    styled,
    kept,
    review,
    reviewQuestions: reviewIds.size,
  };
}

function main() {
  const apply = process.argv.includes("--apply");
  const recorded = JSON.parse(readFileSync(EDITS_PATH, "utf8"));
  const { places } = loadMunicipalities(AREA_PATH);
  const payload = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const result = repairPlaceCopy({
    questions: payload.questions,
    recorded,
    places,
  });
  const summary = {
    ids: recorded.ids.length,
    recordedEdits: recorded.edits.length,
    restored: result.restored,
    reapplied: result.reapplied,
    styled: result.styled,
    hand: result.kept.filter((row) => row.hand).length,
    reviewQuestions: result.reviewQuestions,
    reviewRows: result.review.length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) return;
  const raw = readFileSync(QUESTIONS_PATH, "utf8");
  writeFileSync(QUESTIONS_PATH, writeQuestions(raw, payload.questions, result.changed));
  writeFileSync(
    EDITS_PATH,
    `${JSON.stringify(
      {
        ids: recorded.ids,
        restored: recorded.restored ?? result.restored,
        reapplied: result.reapplied,
        edits: result.kept,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    REVIEW_PATH,
    `${JSON.stringify(
      {
        note: "Pre-#33 sentences that still name a different municipality from the spot coordinates. Story settings, landmarks, and quoted shop names are omitted. Confirm before rewriting.",
        questions: result.reviewQuestions,
        rows: result.review,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote questions, ${EDITS_PATH}, and ${REVIEW_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
