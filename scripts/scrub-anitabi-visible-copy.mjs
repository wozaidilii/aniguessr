/**
 * Remove user-visible "anitabi" brand mentions from pilgrimage copy fields.
 * Keeps spot ids (anitabi_…) and sourceUrl values unchanged.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);

const VISIBLE_FIELDS = new Set([
  "funfact",
  "episodeContext",
  "description",
  "title",
  "animeTitle",
  "answerName",
]);

function scrubVisibleText(input) {
  if (typeof input !== "string" || !/anitabi/i.test(input)) return input;
  let text = input;

  const replacements = [
    [/（来源：Anitabi）/gi, ""],
    [/（出典：Anitabi）/gi, ""],
    [/（出典：Anitabi@[^）]+）/gi, ""],
    [/（来源：Anitabi@[^）]+）/gi, ""],
    [/\(source:\s*Anitabi[^)]*\)/gi, ""],
    [/\(Source:\s*Anitabi[^)]*\)/gi, ""],
    [/（根据anitabi记录[^）]*）/gi, ""],
    [/（anitabi记录[^）]*）/gi, ""],
    [/（anitabiの記録[^）]*）/gi, ""],
    [/\(according to anitabi[^)]*\)/gi, ""],
    [/\(According to anitabi[^)]*\)/gi, ""],
    [/，根据Anitabi社区考证[^。]*。/g, "。"],
    [/，该点被Anitabi用户标注为[^。]*。/g, "。"],
    [/，该巡礼点由Anitabi用户[^。]*。/g, "。"],
    [/，该巡礼点的现实原型位于日本，具体坐标可在Anitabi上查看。/g, "。"],
    [/，具体位置在Anitabi上标记。/g, "。"],
    [/，具体位置在Anitabi上有标记。/g, "。"],
    [/，在Anitabi上被收录为巡礼点。/g, "。"],
    [/，在Anitabi上标注为[^。]*。/g, "。"],
    [/，Anitabi上标注为[^。]*。/g, "。"],
    [/，Anitabiでは[^。]*。/g, "。"],
    [/，Anitabiユーザーによって[^。]*。/g, "。"],
    [/，Anitabiユーザーの[^。]*。/g, "。"],
    [/，Anitabiコミュニティの調査によると[^。]*。/g, "。"],
    [/，Anitabiのデータによると[^。]*。/g, "。"],
    [/，Anitabiの注釈によると[^。]*。/g, "。"],
    [/，Anitabiのエントリによると[^。]*。/g, "。"],
    [/，Anitabi community verification[^.]*\./gi, "."],
    [/，According to Anitabi community verification[^.]*\./gi, "."],
    [/，According to Anitabi data[^.]*\./gi, "."],
    [/，According to the Anitabi entry[^.]*\./gi, "."],
    [/，According to Anitabi annotation[^.]*\./gi, "."],
    [/，This pilgrimage point was contributed by Anitabi user[^.]*\./gi, "."],
    [/，This pilgrimage point was confirmed by the Anitabi user[^.]*\./gi, "."],
    [/，This spot was tagged as [^.]* by an Anitabi user[^.]*\./gi, "."],
    [/，The coordinates for this spot were identified by an Anitabi user\./gi, "."],
    [/，The real-life location of this pilgrimage point is in Japan; specific coordinates can be found on Anitabi\./gi, "."],
    [/，This poster was used for the promotion of the first season and is recorded as a pilgrimage spot on Anitabi\./gi, "."],
    [/，The pilgrimage point was contributed by Anitabi user AmaiAya; the exact episode is unknown\./gi, "."],
    [/，This scene appears in Episode 12 of the first season of LoveLive! Sunshine!! at approximately 9:28 \(source: Anitabi\)\./gi,
      "，This scene appears in Episode 12 of the first season of LoveLive! Sunshine!! at approximately 9:28."],
    [/，This scene appears in Episode 12 of the first season \(Forest School arc\), though the anitabi record lists Episode 8, possibly due to episode numbering differences\./gi,
      "，This scene appears in Episode 12 of the first season (Forest School arc); some records list Episode 8, possibly due to episode numbering differences."],
    [/，The work is a one-shot manga that has not been adapted into anime, so the anitabi entry may come from fan works or field research\./gi,
      "，The work is a one-shot manga that has not been adapted into anime, so this point may come from fan works or field research."],
    [/，The scene is modeled after the real Kyoto Prefectural Sagano High School \(located in Ukyo-ku, Kyoto City; the anitabi entry lists it under Maizuru City, possibly a mistake\)\./gi,
      "，The scene is modeled after the real Kyoto Prefectural Sagano High School (located in Ukyo-ku, Kyoto City; some records list it under Maizuru City, possibly a mistake)."],
    [/，The scene corresponds to the opening minutes of Episode 1, though the Anitabi timestamp of 1379 seconds \(approx\. 22:59\) may indicate a later repeated shot of the same shrine\./gi,
      "，The scene corresponds to the opening minutes of Episode 1, though a timestamp of 1379 seconds (approx. 22:59) may indicate a later repeated shot of the same shrine."],
    [/，According to Anitabi annotation, this pilgrimage point is the real-life reference for the background material 'Toyotake Station', a real unmanned station on a local line in Japan\./gi,
      "，This pilgrimage point is the real-life reference for the background material 'Toyotake Station', a real unmanned station on a local line in Japan."],
    [/，According to the Anitabi entry, this point is a background material in the work, with no specific scene identified\./gi,
      "，This point is a background material in the work, with no specific scene identified."],
    [/，The real-world location is in Shakujii-cho, Nerima-ku, Tokyo \(mistakenly labeled as Shinagawa-ku in anitabi data\)\./gi,
      "，The real-world location is in Shakujii-cho, Nerima-ku, Tokyo (some records mistakenly label it as Shinagawa-ku)."],
    [/，实际取景地位于东京都练马区石神井町（anitabi数据误标为品川区）。/g,
      "，实际取景地位于东京都练马区石神井町（部分记录误标为品川区）。"],
    [/，该场景对应第一集开头约3分钟处，但Anitabi标记的时间戳1379秒（约22分59秒）可能为其他镜头重复出现，核心仍是同一神社。/g,
      "，该场景对应第一集开头约3分钟处，但1379秒（约22分59秒）的时间戳可能为其他镜头重复出现，核心仍是同一神社。"],
    [/，该场景出自《LoveLive! Sunshine!!》第一季第12集约9分28秒处（来源：Anitabi）。/g,
      "，该场景出自《LoveLive! Sunshine!!》第一季第12集约9分28秒处。"],
    [/，该场景出现在动画第一季第12集（林间学校篇），与anitabi记录的第8集可能因版本不同存在差异。/g,
      "，该场景出现在动画第一季第12集（林间学校篇），与部分记录的第8集可能因版本不同存在差异。"],
    [/，这部作品是一部短篇漫画，尚未动画化，因此anitabi条目可能来源于同人创作或实地考察。/g,
      "，这部作品是一部短篇漫画，尚未动画化，因此该条目可能来源于同人创作或实地考察。"],
    [/，该场景的取景地原型是京都府立嵯峨野高等学校（位于京都市右京区，anitabi标记为舞鹤市可能为误标）。/g,
      "，该场景的取景地原型是京都府立嵯峨野高等学校（位于京都市右京区，部分记录标记为舞鹤市可能为误标）。"],
    [/，该场景位于东京都东久留米市的一处住宅区街道，具体位置在Anitabi上标注为‘我这里有一份不错的工作’。/g,
      "，该场景位于东京都东久留米市的一处住宅区街道。"],
    [/第8集（根据anitabi记录；实际为第一季第12集）/g, "第8集（部分记录；实际为第一季第12集）"],
    [/第8話（anitabiの記録による；実際は第1期第12話）/g, "第8話（一部の記録による；実際は第1期第12話）"],
    [/Episode 8 \(according to anitabi; actually Episode 12 of Season 1\)/gi,
      "Episode 8 (according to some records; actually Episode 12 of Season 1)"],
    [/未知集数（来源：Anitabi@concert）/g, "未知集数"],
    [/不明（出典：Anitabi@concert）/g, "不明"],
    [/Unknown episode \(source: Anitabi@concert\)/gi, "Unknown episode"],
    [/アニメの第何話か（出典：Anitabi@concert）で、校外学習の一場面として登場する。/g,
      "アニメの第何話かで、校外学習の一場面として登場する。"],
    [/In an unknown episode \(source: Anitabi@concert\), this scene appears during the characters' off-campus trip\./gi,
      "In an unknown episode, this scene appears during the characters' off-campus trip."],
    [/\[Anitabi\]/gi, ""],
    [/Anitabi uses English sometimes\. Let's assume commonly used:[^.]*\./gi, ""],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  // Fallback: drop remaining standalone brand tokens while keeping ids/urls intact.
  for (let pass = 0; pass < 3; pass += 1) {
    text = text.replace(/\bAnitabi(?:\.cn)?(?:ユーザー|ユーザ|社区|コミュニティ|community|user|data|entry|record|annotation|エントリ|データ|記録|注釈|の[^、。,.;\s]{0,12})?(?:@[\w\u4e00-\u9fff]+)?\b/gi, "");
    text = text.replace(/\banitabi(?: entry| record| data| timestamp|エントリー|の記録|のデータ|标记|标记为)?\b/gi, "");
    text = text.replace(/[（(]\s*(?:来源|出典|source)[:：]?\s*[）)]/gi, "");
    text = text.replace(/[，,]\s*具体位置在[^。]*。/g, "。");
    text = text.replace(/[，,]\s*具体坐标可在[^。]*。/g, "。");
    text = text.replace(/[，,]\s*在[^。]*被收录为巡礼点。/g, "。");
    text = text.replace(/[，,]\s*labeled as [^']*' on Anitabi\./gi, ".");
    text = text.replace(/ on Anitabi\b/gi, "");
    text = text.replace(/ in anitabi data\b/gi, " in some records");
    text = text.replace(/ the anitabi entry\b/gi, " some records");
    text = text.replace(/ the anitabi record\b/gi, " some records");
    text = text.replace(/ anitabi record\b/gi, " some records");
    text = text.replace(/ anitabi entry\b/gi, " this entry");
    text = text.replace(/ anitabi data\b/gi, " some records");
    text = text.replace(/ anitabi timestamp\b/gi, " a timestamp");
    text = text.replace(/ anitabiエントリー\b/gi, " この条目");
    text = text.replace(/ anitabiの記録\b/gi, " 一部の記録");
    text = text.replace(/ anitabiのデータ\b/gi, " 一部のデータ");
    text = text.replace(/ anitabi标记\b/gi, " 部分记录标记");
    text = text.replace(/ anitabiでは\b/gi, " 一部の記録では");
    text = text.replace(/ Anitabiでは\b/gi, "");
    text = text.replace(/ Anitabiに記されている/gi, " 記録されている");
    text = text.replace(/ Anitabiに/gi, "");
    text = text.replace(/ Anitabiで/gi, "");
    text = text.replace(/ Anitabi上/gi, "");
    text = text.replace(/ According to Anitabi[^,.]*[,.]/gi, "");
    text = text.replace(/ According to the Anitabi[^,.]*[,.]/gi, "");
    text = text.replace(/ 根据Anitabi[^，。]*[，。]/g, "");
    text = text.replace(/ 该点被[^，。]*标注为[^，。]*，/g, " 该点");
    text = text.replace(/ 巡礼点由[^，。]*提供，/g, " 巡礼点");
    text = text.replace(/ 该巡礼点由[^。]*。/g, " 该巡礼点已确认。");
    text = text.replace(/ 本条巡礼点信息来自[^，。]*，/g, " 本条巡礼点");
    text = text.replace(/ 聖地情報は[^。]*。/g, " 聖地情報の具体的な話数は不明。");
    text = text.replace(/ contributed by an Anitabi user[^;]*;/gi, "");
    text = text.replace(/ confirmed by the Anitabi user[^.]*\./gi, " confirmed from a frame in episode 12.");
    text = text.replace(/ tagged as '[^']*' by an Anitabi user[^.]*\./gi, " tagged as a fan-associated location.");
    text = text.replace(/ identified by an Anitabi user\./gi, " identified from field research.");
    text = text.replace(/ can be found on Anitabi\./gi, ".");
    text = text.replace(/ marked on Anitabi\./gi, ".");
    text = text.replace(/ recorded as a pilgrimage spot on Anitabi\./gi, " used in season-one promotion art.");
    text = text.replace(/ \[Anitabi\]/gi, "");
  }
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/[，,]\s*([。．.])/g, "$1");
  text = text.replace(/[（(]\s*[）)]/g, "");
  text = text.replace(/^[，,、\s]+/u, "");
  text = text.replace(/[，,、\s]+$/u, "");
  return text.trim();
}

function walkCopy(value, pathParts, changes) {
  if (typeof value === "string") {
    const inVisibleField = pathParts.some(
      (part) => typeof part === "string" && VISIBLE_FIELDS.has(part),
    );
    if (inVisibleField) {
      const next = scrubVisibleText(value);
      if (next !== value) {
        changes.push({ path: pathParts.join("."), before: value, after: next });
      }
      return next;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      walkCopy(item, [...pathParts, String(index)], changes),
    );
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = walkCopy(child, [...pathParts, key], changes);
    }
    return out;
  }
  return value;
}

const raw = JSON.parse(await readFile(QUESTIONS_PATH, "utf8"));
const changes = [];
const next = walkCopy(raw, [], changes);
await writeFile(QUESTIONS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");

let remaining = 0;
function countRemaining(value, path = "") {
  if (typeof value === "string" && /anitabi/i.test(value)) {
    if (path === ".source") return;
    if (!/anitabi_\d+_/.test(value) && !/anitabi\.cn/.test(value)) {
      remaining += 1;
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => countRemaining(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      countRemaining(child, `${path}.${key}`);
    }
  }
}
countRemaining(next);
console.log(`scrubbed ${changes.length} strings; remaining visible mentions: ${remaining}`);
if (remaining > 0) {
  process.exitCode = 1;
}
