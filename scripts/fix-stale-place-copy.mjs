/**
 * Replace municipality and prefecture tokens that disagree with the polygon
 * for spots touched by the #28 label fixes and the #30 name fixes.
 *
 *   node scripts/fix-stale-place-copy.mjs           # print the edits
 *   node scripts/fix-stale-place-copy.mjs --apply   # patch question text
 *
 * Only the place-name token changes. Story-setting clauses (舞台 / set in)
 * are left alone. The game `location` label and tags are not rewritten.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as OpenCC from "opencc-js";
import {
  distanceToMunicipality,
  distanceToOtherPrefecture,
  loadMunicipalities,
  municipalitiesContaining,
} from "./lib/japan-area.mjs";
import { toZhTw } from "./lib/zh-tw.mjs";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);
const NAME_FIXES_PATH = path.join(
  process.cwd(),
  "scripts/data/spot-name-suffix-fixes.json",
);
const LABEL_FIXES_PATH = path.join(
  process.cwd(),
  "scripts/data/question-location-fixes.json",
);
const EDITS_PATH = path.join(
  process.cwd(),
  "scripts/data/spot-copy-edits.json",
);

const BORDER_METERS = 1000;
const toSimplified = OpenCC.Converter({ from: "jp", to: "cn" });

const PREFECTURES = [
  ["01", "北海道", "Hokkaido"],
  ["02", "青森県", "Aomori"],
  ["03", "岩手県", "Iwate"],
  ["04", "宮城県", "Miyagi"],
  ["05", "秋田県", "Akita"],
  ["06", "山形県", "Yamagata"],
  ["07", "福島県", "Fukushima"],
  ["08", "茨城県", "Ibaraki"],
  ["09", "栃木県", "Tochigi"],
  ["10", "群馬県", "Gunma"],
  ["11", "埼玉県", "Saitama"],
  ["12", "千葉県", "Chiba"],
  ["13", "東京都", "Tokyo"],
  ["14", "神奈川県", "Kanagawa"],
  ["15", "新潟県", "Niigata"],
  ["16", "富山県", "Toyama"],
  ["17", "石川県", "Ishikawa"],
  ["18", "福井県", "Fukui"],
  ["19", "山梨県", "Yamanashi"],
  ["20", "長野県", "Nagano"],
  ["21", "岐阜県", "Gifu"],
  ["22", "静岡県", "Shizuoka"],
  ["23", "愛知県", "Aichi"],
  ["24", "三重県", "Mie"],
  ["25", "滋賀県", "Shiga"],
  ["26", "京都府", "Kyoto"],
  ["27", "大阪府", "Osaka"],
  ["28", "兵庫県", "Hyogo"],
  ["29", "奈良県", "Nara"],
  ["30", "和歌山県", "Wakayama"],
  ["31", "鳥取県", "Tottori"],
  ["32", "島根県", "Shimane"],
  ["33", "岡山県", "Okayama"],
  ["34", "広島県", "Hiroshima"],
  ["35", "山口県", "Yamaguchi"],
  ["36", "徳島県", "Tokushima"],
  ["37", "香川県", "Kagawa"],
  ["38", "愛媛県", "Ehime"],
  ["39", "高知県", "Kochi"],
  ["40", "福岡県", "Fukuoka"],
  ["41", "佐賀県", "Saga"],
  ["42", "長崎県", "Nagasaki"],
  ["43", "熊本県", "Kumamoto"],
  ["44", "大分県", "Oita"],
  ["45", "宮崎県", "Miyazaki"],
  ["46", "鹿児島県", "Kagoshima"],
  ["47", "沖縄県", "Okinawa"],
];

/** Ward readings used when English still names only the parent city. */
const WARD_EN = {
  門司区: "Moji-ku",
  若松区: "Wakamatsu-ku",
  戸畑区: "Tobata-ku",
  小倉北区: "Kokurakita-ku",
  小倉南区: "Kokuraminami-ku",
  八幡東区: "Yahatahigashi-ku",
  八幡西区: "Yahatanishi-ku",
  千代田区: "Chiyoda-ku",
  中央区: "Chuo-ku",
  港区: "Minato-ku",
  新宿区: "Shinjuku-ku",
  文京区: "Bunkyo-ku",
  台東区: "Taito-ku",
  墨田区: "Sumida-ku",
  江東区: "Koto-ku",
  品川区: "Shinagawa-ku",
  目黒区: "Meguro-ku",
  大田区: "Ota-ku",
  世田谷区: "Setagaya-ku",
  渋谷区: "Shibuya-ku",
  中野区: "Nakano-ku",
  杉並区: "Suginami-ku",
  豊島区: "Toshima-ku",
  北区: "Kita-ku",
  荒川区: "Arakawa-ku",
  板橋区: "Itabashi-ku",
  練馬区: "Nerima-ku",
  足立区: "Adachi-ku",
  葛飾区: "Katsushika-ku",
  江戸川区: "Edogawa-ku",
  青葉区: "Aoba-ku",
  中区: "Naka-ku",
  西区: "Nishi-ku",
  南区: "Minami-ku",
  東区: "Higashi-ku",
  鶴見区: "Tsurumi-ku",
  神奈川区: "Kanagawa-ku",
  保土ケ谷区: "Hodogaya-ku",
  磯子区: "Isogo-ku",
  金沢区: "Kanazawa-ku",
  港北区: "Kohoku-ku",
  戸塚区: "Totsuka-ku",
  港南区: "Konan-ku",
  旭区: "Asahi-ku",
  緑区: "Midori-ku",
  瀬谷区: "Seya-ku",
  栄区: "Sakae-ku",
  泉区: "Izumi-ku",
  都筑区: "Tsuzuki-ku",
};

/** A place token glued to these words names the feature, not the photo's city. */
const FEATURE_AFTER =
  /^(?:川|橋|山|駅|神社|寺|港|海岸|通り|公園)|^\s*(?:River|Coast|Bridge|Mountain|Mt\.?|Lake|Bay|Port|Beach|Island|Shrine|Temple|Station|Park|Street|Road|Hospital|University|College)\b/iu;

const SETTING_PATTERNS = [
  /舞台は[^。\n]*?(?=だが|但|。|$)/g,
  /を舞台(?:に|と)[^。\n]*/g,
  /舞台设定在[^，。\n]*/g,
  /背景设定在[^，。\n]*/g,
  /背景設定在[^，。\n]*/g,
  /设定在[^，。\n]{0,24}/g,
  /故事发生在[^，。\n]*/g,
  /故事發生在[^，。\n]*/g,
  /set in [^.,;\n]*/gi,
  /is set in [^.,;\n]*/gi,
  /takes place in [^.,;\n]*/gi,
];

const TITLE_PATTERN = /『[^』]*』|「[^」]*」|《[^》]*》|\*[^*]+\*/g;

const TEXT_FIELDS = ["title", "description", "answerName", "episodeContext"];

const MACRON = {
  ō: "o",
  ū: "u",
  ā: "a",
  ē: "e",
  ī: "i",
  Ō: "o",
  Ū: "u",
  Ā: "a",
  Ē: "e",
  Ī: "i",
};

function foldChar(char) {
  const folded = MACRON[char];
  if (folded) return folded;
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(code + 32);
  return char;
}

function rangesFrom(text, pattern) {
  const ranges = [];
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    ranges.push([start, start + match[0].length]);
  }
  return ranges;
}

function protectedRanges(text) {
  const ranges = rangesFrom(text, TITLE_PATTERN);
  for (const pattern of SETTING_PATTERNS) {
    ranges.push(...rangesFrom(text, pattern));
  }
  return ranges;
}

function overlaps(ranges, start, end) {
  return ranges.some(([from, to]) => start < to && end > from);
}

function cityStem(value) {
  const match = /^(.+?市)/u.exec(value ?? "");
  return match?.[1] && match[1] !== value ? match[1] : "";
}

function wardSuffix(ja) {
  const at = ja.lastIndexOf("市");
  const suffix = at >= 0 ? ja.slice(at + 1) : ja;
  return suffix.endsWith("区") ? suffix : "";
}

export function buildForms(places) {
  /** @type {Map<string, { kind: string, pref: string, style: string, codes: Set<string> }>} */
  const forms = new Map();
  const add = (surface, meta) => {
    const key = String(surface ?? "").normalize("NFKC").trim().toLowerCase();
    if (key.length < 2) return;
    const prev = forms.get(key);
    const codes = new Set(meta.codes ?? []);
    if (!prev) {
      forms.set(key, {
        kind: meta.kind,
        pref: meta.pref ?? "",
        style: meta.style,
        codes,
      });
      return;
    }
    for (const code of codes) prev.codes.add(code);
    if (prev.kind !== meta.kind) prev.kind = "ambiguous";
  };

  const prefs = new Map(
    PREFECTURES.map(([code, ja, en]) => {
      const zh = toSimplified(ja);
      return [code, { code, ja, zh, en, tw: toZhTw(zh) }];
    }),
  );
  for (const pref of prefs.values()) {
    add(pref.ja, { kind: "prefecture", pref: pref.code, style: "pref-ja" });
    add(pref.zh, { kind: "prefecture", pref: pref.code, style: "pref-zh" });
    add(pref.tw, { kind: "prefecture", pref: pref.code, style: "pref-tw" });
    add(pref.en, { kind: "prefecture", pref: pref.code, style: "pref-en" });
    add(`${pref.en} Prefecture`, {
      kind: "prefecture",
      pref: pref.code,
      style: "pref-en-long",
    });
  }

  for (const place of places) {
    const codes = [place.code];
    const pref = prefs.get(place.code.slice(0, 2));
    add(place.ja, { kind: "municipality", style: "ja", codes, pref: pref?.code });
    add(place.zh, { kind: "municipality", style: "zh", codes, pref: pref?.code });
    add(toSimplified(place.ja), {
      kind: "municipality",
      style: "zh",
      codes,
      pref: pref?.code,
    });
    add(toZhTw(place.zh), {
      kind: "municipality",
      style: "tw",
      codes,
      pref: pref?.code,
    });
    add(place.en, {
      kind: "municipality",
      style: "en-full",
      codes,
      pref: pref?.code,
    });
    const short = place.en.split(",")[0]?.trim() ?? "";
    add(short, { kind: "municipality", style: "en", codes, pref: pref?.code });
    add(`${short} City`, {
      kind: "municipality",
      style: "en-city",
      codes,
      pref: pref?.code,
    });
    if (pref && place.ja.startsWith(pref.ja) && place.ja.length > pref.ja.length) {
      add(place.ja.slice(pref.ja.length), {
        kind: "municipality",
        style: "ja-short",
        codes,
        pref: pref.code,
      });
    }
    const jaCity = cityStem(place.ja);
    if (jaCity) {
      add(jaCity, {
        kind: "municipality",
        style: "ja-city",
        codes,
        pref: pref?.code,
      });
    }
    const zhCity = cityStem(place.zh);
    if (zhCity) {
      add(zhCity, {
        kind: "municipality",
        style: "zh-city",
        codes,
        pref: pref?.code,
      });
      add(toZhTw(zhCity), {
        kind: "municipality",
        style: "tw-city",
        codes,
        pref: pref?.code,
      });
    }
  }

  const alias = (surface, shortName) => {
    const source = forms.get(shortName.toLowerCase());
    if (!source) return;
    add(surface, source);
  };
  alias("Nishi-Tokyo", "Nishitokyo");
  alias("Nishi Tokyo", "Nishitokyo");
  alias("Higashi-Kurume", "Higashikurume");
  alias("Higashi Kurume", "Higashikurume");
  alias("Isezaki", "Isesaki");
  alias("Isezaki City", "Isesaki City");

  const root = { next: new Map(), hits: [] };
  for (const [key, meta] of forms) {
    let node = root;
    for (const char of key) {
      let child = node.next.get(char);
      if (!child) {
        child = { next: new Map(), hits: [] };
        node.next.set(char, child);
      }
      node = child;
    }
    node.hits.push({ key, ...meta });
  }
  return { root, prefs };
}

function resolvePlace(lng, lat) {
  const contained = municipalitiesContaining(lng, lat);
  if (contained.length === 1) return contained[0];
  if (contained.length > 1) return null;
  return null;
}

function acceptable(hit, place) {
  if (hit.kind === "ambiguous") return true;
  if (hit.kind === "prefecture") return hit.pref === place.code.slice(0, 2);
  return hit.codes.has(place.code);
}

/** @type {Map<string, { code: string, bbox?: number[], rings?: number[][] }>} */
let placesByCode = new Map();

export function setPlaceIndex(places) {
  placesByCode = new Map(places.map((place) => [place.code, place]));
}

/**
 * Keep a stale name only when that named place is actually on the border.
 * A point near some other ward must still replace a city hundreds of km away.
 */
function namedPlaceIsAdjacent(hit, place, lng, lat) {
  if (hit.kind === "prefecture") {
    return (
      distanceToOtherPrefecture(lng, lat, place.code.slice(0, 2)) < BORDER_METERS
    );
  }
  let nearest = Infinity;
  for (const code of hit.codes) {
    nearest = Math.min(nearest, distanceToMunicipality(lng, lat, placesByCode.get(code)));
  }
  return nearest < BORDER_METERS;
}

function wardEnglish(place) {
  return WARD_EN[wardSuffix(place.ja)] ?? "";
}

function replacement(hit, place, prefs, script, surface) {
  const pref = prefs.get(place.code.slice(0, 2));
  if (hit.kind === "prefecture") {
    if (!pref) return "";
    if (script === "en") {
      return /prefecture/iu.test(surface) ? `${pref.en} Prefecture` : pref.en;
    }
    if (script === "zh") return pref.zh;
    return pref.ja;
  }
  const ward = wardEnglish(place);
  if (script === "en") {
    const short = place.en.split(",")[0]?.trim() ?? "";
    if (ward) {
      return surface.includes(",") && pref ? `${ward}, ${pref.en}` : ward;
    }
    const town = /郡/.test(place.ja);
    if (/city$/iu.test(surface.trim())) {
      if (town || !short) return short;
      return `${short} City`;
    }
    if (surface.includes(",")) return place.en;
    return short;
  }
  if (script === "zh") return place.zh;
  if (script === "tw") return toZhTw(place.zh);
  return place.ja;
}

function latinBounded(text, start, end) {
  const slice = text.slice(start, end);
  if (!/[A-Za-z]/u.test(slice)) return true;
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  return !/[A-Za-z]/u.test(before ?? "") && !/[A-Za-z]/u.test(after ?? "");
}

function gazetteerHas(forms, word) {
  let node = forms.root;
  for (const char of word.toLowerCase()) {
    node = node.next.get(char);
    if (!node) return false;
  }
  return node.hits.length > 0;
}

/** Bare English names also occur as character names. Require a place cue. */
function placeContext(text, start, end, style, forms) {
  if (style !== "en" && style !== "pref-en") return true;
  const before = text.slice(Math.max(0, start - 16), start);
  const after = text.slice(end, Math.min(text.length, end + 40));
  if (/[（(]\s*$/u.test(before)) return true;
  if (/^\s*(?:Prefecture|City|Ward)\b/iu.test(after)) return true;
  const comma = /^\s*,\s*([A-Za-z][A-Za-z-]*)/u.exec(after);
  if (!comma) return false;
  const word = (comma[1] ?? "").toLowerCase();
  if (word === "prefecture" || word === "city" || word === "ward") return true;
  return PREFECTURES.some((row) => row[2].toLowerCase() === word);
}

function isNameSuffix(text, end) {
  return /^-(?:kun|chan|san|sama)\b/iu.test(text.slice(end, end + 8));
}

/** `Isezaki City, Gunma` must not become `Isezaki City, Tokyo`. */
function precedingCityKnown(text, start, forms) {
  const before = text.slice(Math.max(0, start - 40), start);
  const match = /([A-Za-z][A-Za-z-]*)\s+City,\s*$/u.exec(before);
  if (!match?.[1]) return true;
  return gazetteerHas(forms, match[1]);
}

function extendLatinAdmin(text, end) {
  const suffix = /^-(?:ku|shi|gun|machi|cho|mura)\b/iu.exec(text.slice(end, end + 8));
  return suffix ? end + suffix[0].length : end;
}

/** `貝塚 (Kaizuka)` is a translation gloss, not a municipality claim. */
function isGlossTranslation(text, start) {
  const before = text.slice(Math.max(0, start - 16), start);
  return /[\u3040-\u9fff]\s*[（(]\s*$/u.test(before);
}

function isFeatureName(text, end) {
  const after = text.slice(end, end + 64);
  if (FEATURE_AFTER.test(after)) return true;
  const clause = after.split(/[.,;，。]/u)[0] ?? "";
  return /\b(?:School|Store|Shrine|Station|Hospital|University|College|Bakery|Temple|Bridge|Street)\b/iu.test(
    clause,
  );
}

function tokenScript(surface, text) {
  if (/[A-Za-z]/u.test(surface) && !/[\u3040-\u30ff\u4e00-\u9fff]/u.test(surface)) {
    return "en";
  }
  if (/[ぁ-んァ-ン県區]/u.test(surface)) return "ja";
  if (/[县区门东广湾]/u.test(surface)) return "zh";
  if (/[ぁ-んァ-ン]/u.test(text)) return "ja";
  const simplified = (text.match(/[县东广门湾对这来后]/gu) ?? []).length;
  const traditional = (text.match(/[縣東廣門灣對這來後県]/gu) ?? []).length;
  if (traditional > simplified) return "ja";
  if (simplified > 0) return "zh";
  return "ja";
}

export function rewriteText(text, place, forms, lng, lat) {
  if (!text) return text;
  const blocked = protectedRanges(text);
  let out = "";
  let index = 0;
  while (index < text.length) {
    if (overlaps(blocked, index, index + 1)) {
      out += text[index];
      index += 1;
      continue;
    }
    let node = forms.root;
    /** @type {{ hit: any, end: number }[]} */
    const found = [];
    for (let cursor = index; cursor < text.length; cursor += 1) {
      node = node.next.get(foldChar(text[cursor]));
      if (!node) break;
      for (const hit of node.hits) {
        found.push({ hit, end: cursor + 1 });
      }
    }
    let chosen = null;
    for (let pick = found.length - 1; pick >= 0; pick -= 1) {
      const item = found[pick];
      if (!item) continue;
      if (overlaps(blocked, index, item.end)) continue;
      if (!latinBounded(text, index, item.end)) continue;
      let end = item.end;
      if (/[A-Za-z]/u.test(text.slice(index, end))) end = extendLatinAdmin(text, end);
      if (isFeatureName(text, end) || isGlossTranslation(text, index)) continue;
      if (isNameSuffix(text, end)) continue;
      if (!placeContext(text, index, end, item.hit.style, forms)) continue;
      if (
        item.hit.kind === "prefecture" &&
        !precedingCityKnown(text, index, forms)
      ) {
        continue;
      }
      chosen = { hit: item.hit, end };
      break;
    }
    if (!chosen) {
      out += text[index];
      index += 1;
      continue;
    }
    const surface = text.slice(index, chosen.end);
    const script = tokenScript(surface, text);
    const next =
      acceptable(chosen.hit, place) || namedPlaceIsAdjacent(chosen.hit, place, lng, lat)
        ? surface
        : replacement(chosen.hit, place, forms.prefs, script, surface);
    if (!next || next.toLowerCase() === surface.toLowerCase()) {
      out += surface;
    } else {
      out += next;
    }
    index = chosen.end;
  }
  return out;
}

function matchWhole(text, forms) {
  let node = forms.root;
  for (const char of text.trim()) {
    node = node.next.get(foldChar(char));
    if (!node) return null;
  }
  return node.hits.at(-1) ?? null;
}

function upgradeAnswerName(value, place, locale, forms) {
  const match = /^(.*?)([（(])([^（）()]{1,48})([）)])$/u.exec(value.trim());
  if (!match || !place.ja.includes("区")) return value;
  const body = match[1] ?? "";
  const open = match[2] ?? "";
  const inner = (match[3] ?? "").trim();
  const close = match[4] ?? "";
  const hit = matchWhole(inner, forms);
  if (!hit || !acceptable(hit, place)) return value;
  const wardJa = wardSuffix(place.ja);
  const wardZh = wardSuffix(place.zh);
  let specific = "";
  if (locale === "ja") {
    if (inner.includes(wardJa)) return value;
    specific = place.ja;
  } else if (locale === "en") {
    const ward = WARD_EN[wardJa];
    if (!ward || inner.toLowerCase().includes(ward.toLowerCase())) return value;
    specific = ward;
  } else {
    if ((wardZh && inner.includes(wardZh)) || inner.includes(wardJa)) return value;
    specific = place.zh;
  }
  if (!specific || specific === inner) return value;
  return `${body}${open}${specific}${close}`;
}

function answerNamesWard(question, place) {
  const wardJa = wardSuffix(place.ja);
  const wardZh = wardSuffix(place.zh);
  const names = [question.answerName, question.locales?.ja?.answerName];
  return names.some((name) => {
    if (typeof name !== "string" || !name) return false;
    return (wardJa && name.includes(wardJa)) || (wardZh && name.includes(wardZh));
  });
}

export function editQuestion(question, place, forms) {
  const edits = [];
  const lng = question.lng;
  const lat = question.lat;
  const apply = (holder, key, field, locale) => {
    const current = holder?.[key];
    if (typeof current !== "string" || !current) return;
    let next = rewriteText(current, place, forms, lng, lat);
    if (
      field.endsWith("answerName") &&
      locale === "en" &&
      answerNamesWard(question, place)
    ) {
      next = upgradeAnswerName(next, place, locale, forms);
    }
    if (next === current) return;
    holder[key] = next;
    edits.push({ field, from: current, to: next });
  };
  const applyList = (holder, key, field, locale) => {
    const list = holder?.[key];
    if (!Array.isArray(list)) return;
    list.forEach((item, index) => {
      if (typeof item !== "string" || !item) return;
      const next = rewriteText(item, place, forms, lng, lat);
      if (next === item) return;
      list[index] = next;
      edits.push({ field: `${field}[${index}]`, from: item, to: next });
    });
    if (locale) {
      /* funfacts are not answer names */
    }
  };
  for (const field of TEXT_FIELDS) {
    apply(question, field, field, "zh");
    apply(question.locales?.ja, field, `locales.ja.${field}`, "ja");
    apply(question.locales?.en, field, `locales.en.${field}`, "en");
  }
  applyList(question, "funfact", "funfact", "zh");
  applyList(question.locales?.ja, "funfact", "locales.ja.funfact", "ja");
  applyList(question.locales?.en, "funfact", "locales.en.funfact", "en");
  return edits;
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

function affectedIds() {
  const ids = new Set();
  const labels = JSON.parse(readFileSync(LABEL_FIXES_PATH, "utf8"));
  const names = JSON.parse(readFileSync(NAME_FIXES_PATH, "utf8"));
  for (const row of labels.fixes ?? []) ids.add(row.id);
  for (const row of names.names?.fixes ?? []) ids.add(row.id);
  return ids;
}

function main() {
  const apply = process.argv.includes("--apply");
  const ids = affectedIds();
  const { places } = loadMunicipalities(AREA_PATH);
  setPlaceIndex(places);
  const forms = buildForms(places);
  const payload = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const questions = payload.questions ?? [];
  const edits = [];
  const changed = new Set();
  for (const question of questions) {
    if (!ids.has(question.id)) continue;
    const place = resolvePlace(question.lng, question.lat);
    if (!place) continue;
    const rows = editQuestion(question, place, forms);
    if (rows.length === 0) continue;
    changed.add(question.id);
    for (const row of rows) edits.push({ id: question.id, ...row });
  }

  const sampleIds = [
    "anitabi_37137_4slhba842",
    "anitabi_1931_50vjonq3x",
    "anitabi_51_sww4zc3ji",
    "anitabi_51_9o4xk23",
    "anitabi_234_5z3hugd",
  ];
  if (process.env.COPY_PREVIEW) {
    writeFileSync(process.env.COPY_PREVIEW, JSON.stringify(edits));
  }
  console.log(
    JSON.stringify(
      {
        affected: ids.size,
        questionsEdited: changed.size,
        tokens: edits.length,
        samples: edits.filter((row) => sampleIds.includes(row.id)),
      },
      null,
      2,
    ),
  );

  if (!apply) return;
  const raw = readFileSync(QUESTIONS_PATH, "utf8");
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
  writeFileSync(QUESTIONS_PATH, pieces.join(""));
  writeFileSync(
    EDITS_PATH,
    `${JSON.stringify({ ids: [...changed].sort(), edits }, null, 2)}\n`,
  );
  console.log(`Wrote ${changed.size} questions and ${EDITS_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
