/**
 * Allowlist for re-applying a municipality correction.
 * A sentence is edited only when it states where this spot is, the polygon
 * contains the point, and exactly one administrative phrase is wrong.
 * Description, episode context, and title are never rewritten here.
 */
import * as OpenCC from "opencc-js";
import { PREFECTURES, WARD_EN } from "../fix-stale-place-copy.mjs";

const toSimplified = OpenCC.Converter({ from: "jp", to: "cn" });

const SETTING =
  /舞台|設定|设定|被设定为|架空|虚构|setting|based on|hometown/iu;
const LANDMARK =
  /(?:神社|神宮|寺|駅|高校|大学|博物館|中学校|小学校|橋|温泉)|(?:「[^」]{1,40}」|『[^』]{1,40}』|“[^”]{1,40}”|"[^"]{1,40}"|'[^']{1,40}')|(?:\b(?:Shrine|Temple|Station|Bridge|High School|University|Museum)\b)/iu;
const SIMPLIFIED_JA = /[泽滨镇县]/u;
const LOCATION_CUE = {
  ja: /にある|にあります|に位置|所在|ロケ地|撮影地|取景|モデルは|モデルとな|実在|現実の|実際の/u,
  zh: /位于|坐落|取景|原型|现实|实际/u,
  en: /\b(?:located in|is located|location is|filmed at|filmed in|shot in|real-life|real life)\b/iu,
};

const BLOCKED_FIELDS = ["description", "episodeContext", "title"];

export function fieldLocale(field) {
  if (field.startsWith("locales.ja.")) return "ja";
  if (field.startsWith("locales.en.")) return "en";
  return "zh";
}

export function fieldKind(field) {
  const bare = field.replace(/^locales\.(?:ja|en)\./u, "").replace(/\[\d+\]$/u, "");
  if (BLOCKED_FIELDS.includes(bare)) return "blocked";
  if (bare === "answerName") return "answerName";
  return "funfact";
}

function prefOf(code) {
  return String(code ?? "").slice(0, 2);
}

function wardJa(ja) {
  const at = ja.lastIndexOf("市");
  const suffix = at >= 0 ? ja.slice(at + 1) : ja;
  return suffix.endsWith("区") ? suffix : "";
}

export function buildGazetteer(places) {
  /** @type {Map<string, { key: string, kind: string, codes: Set<string>, pref: string, ambiguous: boolean }>} */
  const byKey = new Map();
  const add = (surface, meta) => {
    const key = String(surface ?? "").normalize("NFKC").trim();
    if (key.length < 2) return;
    if (/[A-Za-z]/u.test(key) && key.replace(/[^A-Za-z]/gu, "").length < 4) return;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, {
        key,
        kind: meta.kind,
        codes: new Set(meta.codes ?? []),
        pref: meta.pref ?? "",
        ambiguous: false,
      });
      return;
    }
    for (const code of meta.codes ?? []) prev.codes.add(code);
    if (prev.kind !== meta.kind || (meta.pref && prev.pref && prev.pref !== meta.pref)) {
      prev.ambiguous = true;
    }
    if (prev.codes.size > 1 && prev.kind !== "parent") prev.ambiguous = true;
  };

  const prefs = new Map();
  for (const [code, ja, en] of PREFECTURES) {
    const zh = toSimplified(ja);
    prefs.set(code, { code, ja, zh, en });
    add(ja, { kind: "pref", pref: code });
    add(zh, { kind: "pref", pref: code });
    add(en, { kind: "pref", pref: code });
    add(`${en} Prefecture`, { kind: "pref", pref: code });
  }

  /** @type {Map<string, Set<string>>} */
  const parents = new Map();
  for (const place of places) {
    const pref = prefOf(place.code);
    add(place.ja, { kind: "muni", codes: [place.code], pref });
    add(place.zh, { kind: "muni", codes: [place.code], pref });
    add(toSimplified(place.ja), { kind: "muni", codes: [place.code], pref });
    const city = /^(.+市).+区$/u.exec(place.ja);
    if (city?.[1]) {
      const set = parents.get(city[1]) ?? new Set();
      set.add(place.code);
      parents.set(city[1], set);
    }
    const short = String(place.en ?? "").split(",")[0]?.trim() ?? "";
    const ward = wardJa(place.ja);
    const ku = WARD_EN[ward];
    const stem = ku ? ku.slice(0, Math.max(0, ku.indexOf("-"))).toLowerCase() : "";
    const shortIsWard = Boolean(stem) && short.toLowerCase().startsWith(stem);
    if (ward && !shortIsWard) {
      add(short, { kind: "parent", codes: [place.code], pref });
    } else {
      add(short, { kind: "muni", codes: [place.code], pref });
    }
    if (place.ja.endsWith("市") && !place.ja.includes("区") && !place.ja.includes("郡")) {
      add(`${short} City`, { kind: "muni", codes: [place.code], pref });
    }
    if (ku) add(ku, { kind: "muni", codes: [place.code], pref });
  }
  for (const [stem, codes] of parents) {
    add(stem, { kind: "parent", codes: [...codes], pref: prefOf([...codes][0]) });
    add(toSimplified(stem), {
      kind: "parent",
      codes: [...codes],
      pref: prefOf([...codes][0]),
    });
  }

  const root = { next: new Map(), hit: null };
  for (const hit of byKey.values()) {
    let node = root;
    for (const char of hit.key) {
      let child = node.next.get(char);
      if (!child) {
        child = { next: new Map(), hit: null };
        node.next.set(char, child);
      }
      node = child;
    }
    node.hit = hit;
  }
  return { root, prefs, places: new Map(places.map((place) => [place.code, place])) };
}

function longest(text, index, root) {
  let node = root;
  let found = null;
  for (let cursor = index; cursor < text.length; cursor += 1) {
    node = node.next.get(text[cursor]);
    if (!node) break;
    if (node.hit) found = { hit: node.hit, end: cursor + 1 };
  }
  return found;
}

function latinBounded(text, start, end, key) {
  if (!/[A-Za-z]/u.test(key)) return true;
  const before = text[start - 1] ?? "";
  const after = text[end] ?? "";
  return !/[A-Za-z]/u.test(before) && !/[A-Za-z]/u.test(after);
}

function startsAdmin(text, index, gazetteer) {
  const found = longest(text, index, gazetteer.root);
  return Boolean(found && latinBounded(text, index, found.end, found.hit.key));
}

function gluedAfter(text, end, gazetteer) {
  const rest = text.slice(end);
  if (/^(?:市立|町立|県立)/u.test(rest)) return true;
  if (/^\s*(?:Incident|Cup|arc|segment)\b/u.test(rest)) return true;
  const next = text[end] ?? "";
  if (!next) return false;
  if (/\p{Script=Han}/u.test(next)) return !startsAdmin(text, end, gazetteer);
  return false;
}

function gluedBefore(text, start) {
  const prev = text[start - 1] ?? "";
  if (!/\p{Script=Han}/u.test(prev)) return false;
  if (/[県县都府道市区區郡町村于的在是和与及为為從从到对對把被让讓向往]/u.test(prev)) return false;
  if (text.slice(start - 2, start) === "日本") return false;
  return true;
}

function classify(hit, place) {
  if (hit.kind === "pref") {
    if (hit.ambiguous) return "unsure";
    return hit.pref === prefOf(place.code) ? "ok" : "wrong";
  }
  if (hit.codes.has(place.code)) return "ok";
  if (hit.kind === "parent" && (place.ja.startsWith(hit.key) || place.ja.startsWith(toSimplified(hit.key)))) {
    return "ok";
  }
  if (hit.kind === "parent") return "wrong";
  if (hit.ambiguous || hit.codes.size !== 1) return "unsure";
  return "wrong";
}

function tokensIn(text, gazetteer) {
  const found = [];
  let index = 0;
  while (index < text.length) {
    const match = longest(text, index, gazetteer.root);
    if (!match || !latinBounded(text, index, match.end, match.hit.key)) {
      index += 1;
      continue;
    }
    found.push({ start: index, end: match.end, hit: match.hit });
    index = match.end;
  }
  return found;
}

function clusterTokens(text, tokens) {
  /** @type {typeof tokens[]} */
  const groups = [];
  for (const token of tokens) {
    const prev = groups.at(-1);
    if (!prev) {
      groups.push([token]);
      continue;
    }
    const gap = text.slice(prev.at(-1).end, token.start);
    if (/^[\s、,]*$/u.test(gap)) prev.push(token);
    else groups.push([token]);
  }
  return groups;
}

function subareaBlocks(text, place) {
  const extras = text.match(/[\p{Script=Han}ぁ-んァ-ンー]{1,12}(?:町|村|郡)/gu) ?? [];
  return extras.some((extra) => !place.ja.includes(extra));
}

function insideBlockedParen(text, start, end, gazetteer) {
  const before = text.slice(0, start);
  const open = Math.max(before.lastIndexOf("("), before.lastIndexOf("（"));
  const close = Math.max(before.lastIndexOf(")"), before.lastIndexOf("）"));
  if (open < 0 || open < close) return false;
  const after = text.slice(end);
  const closeAt = after.search(/[)）]/u);
  if (closeAt < 0) return true;
  const inner = text.slice(open + 1, end + closeAt);
  return !parenIsPlaceLabel(inner, gazetteer);
}

function parenIsPlaceLabel(inner, gazetteer) {
  let index = 0;
  while (index < inner.length) {
    const ch = inner[index] ?? "";
    if (/[\s,、]/.test(ch)) {
      index += 1;
      continue;
    }
    if (/^(?:Prefecture|City|Ward)\b/iu.test(inner.slice(index))) {
      const word = /^(?:Prefecture|City|Ward)\b/iu.exec(inner.slice(index));
      index += word?.[0].length ?? 1;
      continue;
    }
    const match = longest(inner, index, gazetteer.root);
    if (!match || !latinBounded(inner, index, match.end, match.hit.key)) return false;
    index = match.end;
  }
  return inner.trim().length > 0;
}

function hasPlaceParen(text, gazetteer) {
  for (const match of text.matchAll(/[（(]([^（）()]{1,48})[）)]/gu)) {
    if (parenIsPlaceLabel(match[1] ?? "", gazetteer)) return true;
  }
  return false;
}

export function splitSentences(text, locale) {
  if (!text) return [];
  if (locale === "en") {
    const parts = text.split(/(?<=\.)\s+(?=[A-Z])|\n/u);
    return parts.filter((part) => part.length > 0);
  }
  const parts = text.split(/(?<=[。！？])|\n/u);
  return parts.filter((part) => part.length > 0);
}

function scriptOf(hit) {
  return /[A-Za-z]/u.test(hit.key) ? "en" : "cjk";
}

function sameScript(hit, locale) {
  const script = scriptOf(hit);
  if (locale === "en") return script === "en";
  return script === "cjk";
}

function prefRecord(place, gazetteer) {
  return gazetteer.prefs.get(prefOf(place.code));
}

function formatEn(place, surface, gazetteer) {
  const ward = wardJa(place.ja);
  const ku = WARD_EN[ward];
  if (ku) {
    const wardEn = ku.replace(/-ku$/u, " Ward");
    const [short, region] = String(place.en ?? "")
      .split(",")
      .map((part) => part.trim());
    const stem = ku.slice(0, ku.indexOf("-")).toLowerCase();
    const city =
      short && stem && short.toLowerCase().startsWith(stem) ? region : short;
    if (city) return `${wardEn}, ${city}`;
    return wardEn;
  }
  const pref = prefRecord(place, gazetteer);
  const short = String(place.en ?? "").split(",")[0]?.trim() ?? "";
  if (/City$/iu.test(surface) && place.ja.endsWith("市") && !/[区郡]/u.test(place.ja)) {
    return `${short} City`;
  }
  if (surface.includes(",") && pref) return `${short}, ${pref.en}`;
  return short || place.en;
}

function renderCluster(text, cluster, place, locale, gazetteer) {
  const surface = text.slice(cluster[0].start, cluster.at(-1).end);
  const pref = prefRecord(place, gazetteer);
  const hasPref = cluster.some((token) => token.hit.kind === "pref");
  const hasMuni = cluster.some((token) => token.hit.kind !== "pref");
  if (locale === "ja") {
    if (hasPref && hasMuni) {
      return place.ja.startsWith(pref?.ja ?? "\0") ? place.ja : `${pref.ja}${place.ja}`;
    }
    if (hasPref) return pref?.ja ?? surface;
    return place.ja;
  }
  if (locale === "zh") {
    const city = toSimplified(place.ja);
    const prefZh = pref?.zh ?? "";
    if (hasPref && hasMuni) return city.startsWith(prefZh) ? city : `${prefZh}${city}`;
    if (hasPref) return prefZh || surface;
    return city;
  }
  if (hasPref && !hasMuni) {
    const name = pref?.en ?? "";
    if (name === "Tokyo" || name === "Hokkaido") return name;
    return /Prefecture/iu.test(surface) ? `${name} Prefecture` : name;
  }
  return formatEn(place, surface, gazetteer);
}

function prefName(place, locale, surface, gazetteer) {
  const pref = prefRecord(place, gazetteer);
  if (!pref) return "";
  if (locale === "ja") return pref.ja;
  if (locale === "zh") return pref.zh;
  if (pref.en === "Tokyo" || pref.en === "Hokkaido") return pref.en;
  return /Prefecture/iu.test(surface) ? `${pref.en} Prefecture` : pref.en;
}

/** A correct city keeps its name; only a contradictory prefecture beside it changes. */
function alignAdjacentPrefecture(sentence, place, locale, gazetteer) {
  const tokens = tokensIn(sentence, gazetteer).filter(
    (token) =>
      sameScript(token.hit, locale) &&
      !gluedBefore(sentence, token.start) &&
      !insideBlockedParen(sentence, token.start, token.end, gazetteer),
  );
  const groups = clusterTokens(sentence, tokens);
  let out = sentence;
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    const pref = group.find((token) => token.hit.kind === "pref");
    const muni = group.find((token) => token.hit.kind !== "pref");
    if (!pref || !muni) continue;
    if (classify(muni.hit, place) !== "ok" || classify(pref.hit, place) !== "wrong") continue;
    const name = prefName(place, locale, sentence.slice(pref.start, pref.end), gazetteer);
    if (!name) continue;
    out = out.slice(0, pref.start) + name + out.slice(pref.end);
  }
  return out;
}

function rewriteSentence(sentence, place, locale, kind, gazetteer) {
  const aligned = alignAdjacentPrefecture(sentence, place, locale, gazetteer);
  if (SETTING.test(aligned) || LANDMARK.test(aligned) || subareaBlocks(aligned, place)) {
    return aligned;
  }
  const cue =
    LOCATION_CUE[locale].test(aligned) ||
    (kind === "answerName" && hasPlaceParen(aligned, gazetteer));
  if (!cue) return aligned;

  const tokens = tokensIn(aligned, gazetteer).filter(
    (token) =>
      sameScript(token.hit, locale) &&
      !gluedBefore(aligned, token.start) &&
      !gluedAfter(aligned, token.end, gazetteer) &&
      !insideBlockedParen(aligned, token.start, token.end, gazetteer),
  );
  const annotated = tokens.map((token) => ({
    ...token,
    state: classify(token.hit, place),
  }));
  if (annotated.some((token) => token.state === "unsure")) return aligned;
  const wrongGroups = clusterTokens(aligned, annotated).filter((group) =>
    group.some((token) => token.state === "wrong"),
  );
  if (wrongGroups.length !== 1) return aligned;
  const group = wrongGroups[0];
  if (group.length > 2) return aligned;
  const next = renderCluster(aligned, group, place, locale, gazetteer);
  if (!next || next === aligned.slice(group[0].start, group.at(-1).end)) return aligned;
  const rewritten =
    aligned.slice(0, group[0].start) + next + aligned.slice(group.at(-1).end);
  if (doubledPrefecture(rewritten) || mismatchedAdjacent(rewritten, gazetteer).length > 0) {
    return aligned;
  }
  if (locale === "ja" && SIMPLIFIED_JA.test(rewritten)) return aligned;
  if (locale === "en" && /Tokyo Prefecture|Hokkaido Prefecture/u.test(rewritten)) {
    return aligned;
  }
  return rewritten;
}

/**
 * @param {"ja" | "zh" | "en"} locale
 * @param {"funfact" | "answerName" | "blocked"} kind
 */
export function strictRewrite(text, place, locale, kind, gazetteer) {
  if (!text || !place || kind === "blocked") return text;
  const parts = splitSentences(text, locale);
  if (parts.length === 0) return text;
  let cursor = 0;
  let out = "";
  for (const part of parts) {
    const at = text.indexOf(part, cursor);
    if (at < 0) return text;
    out += text.slice(cursor, at);
    out += rewriteSentence(part, place, locale, kind, gazetteer);
    cursor = at + part.length;
  }
  out += text.slice(cursor);
  return out;
}

export function doubledPrefecture(text) {
  if (!text) return false;
  const names = PREFECTURES.map((row) => row[1]).sort((a, b) => b.length - a.length);
  const body = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|");
  return new RegExp(`(${body})\\s*\\1`, "u").test(text);
}

export function mismatchedAdjacent(text, gazetteer) {
  if (!text) return [];
  const tokens = tokensIn(text, gazetteer).filter(
    (token) => !token.hit.ambiguous && token.hit.codes.size <= 1 || token.hit.kind === "pref" || token.hit.kind === "parent",
  );
  const problems = [];
  const groups = clusterTokens(text, tokens);
  for (const group of groups) {
    const pref = group.find((token) => token.hit.kind === "pref");
    const muni = group.find((token) => token.hit.kind !== "pref" && !token.hit.ambiguous);
    if (!pref || !muni) continue;
    const muniPref = muni.hit.pref;
    const after = text.slice(group.at(-1).end, group.at(-1).end + 16);
    if (/^\s*(?:Station|School|Shrine|Temple|Bridge)\b/iu.test(after)) continue;
    if (/^(?:駅|神社|寺|高校|大学)/u.test(after)) continue;
    if (muniPref && pref.hit.pref && muniPref !== pref.hit.pref) {
      problems.push(text.slice(group[0].start, group.at(-1).end));
    }
  }
  return problems;
}

export function containsSimplifiedJa(text) {
  return SIMPLIFIED_JA.test(text ?? "");
}

/** Location claims that still name a different municipality. */
export function staleLocationTokens(text, place, locale, gazetteer) {
  if (!text || !place) return [];
  const stale = [];
  for (const sentence of splitSentences(text, locale)) {
    if (SETTING.test(sentence) || LANDMARK.test(sentence)) continue;
    const cue =
      LOCATION_CUE[locale].test(sentence) || hasPlaceParen(sentence, gazetteer);
    if (!cue) continue;
    for (const token of tokensIn(sentence, gazetteer)) {
      if (!sameScript(token.hit, locale)) continue;
      if (gluedBefore(sentence, token.start) || gluedAfter(sentence, token.end, gazetteer)) {
        continue;
      }
      if (insideBlockedParen(sentence, token.start, token.end, gazetteer)) continue;
      if (classify(token.hit, place) !== "wrong") continue;
      stale.push(sentence.slice(token.start, token.end));
    }
  }
  return [...new Set(stale)];
}

export function readField(question, field) {
  const match = /^(.*?)(?:\[(\d+)\])?$/u.exec(field);
  const path = (match?.[1] ?? field).split(".").filter(Boolean);
  const index = match?.[2];
  let node = question;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  if (index == null) return node;
  return Array.isArray(node) ? node[Number(index)] : undefined;
}

export function writeField(question, field, value) {
  const match = /^(.*?)(?:\[(\d+)\])?$/u.exec(field);
  const path = (match?.[1] ?? field).split(".").filter(Boolean);
  const index = match?.[2];
  let node = question;
  for (let cursor = 0; cursor < path.length - 1; cursor += 1) {
    node = node[path[cursor]];
  }
  const key = path.at(-1);
  if (index == null) node[key] = value;
  else node[key][Number(index)] = value;
}
