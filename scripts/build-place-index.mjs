/**
 * Compact municipality index for in-game place labels.
 * Source: scripts/data/japan-municipalities.json (ja / en / zh, no invented romaji).
 * Rings stay out of the client bundle.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as OpenCC from "opencc-js";

const toCn = OpenCC.Converter({ from: "jp", to: "cn" });
const toTw = OpenCC.Converter({ from: "cn", to: "tw" });

/** OpenCC jp→cn leaves a few mainland forms (并 / 吴) unconverted. */
function mainland(text) {
  return toCn(text)
    .replaceAll("竝", "并")
    .replaceAll("並", "并")
    .replaceAll("呉", "吴")
    .replaceAll("吳", "吴");
}

/** Full admin names. Keep in sync with src/lib/place-names.ts. */
const PREFECTURE_NAMES = [
  ["hokkaido", "北海道", "北海道", "北海道"],
  ["aomori", "青森県", "青森县", "青森縣"],
  ["iwate", "岩手県", "岩手县", "岩手縣"],
  ["miyagi", "宮城県", "宫城县", "宮城縣"],
  ["akita", "秋田県", "秋田县", "秋田縣"],
  ["yamagata", "山形県", "山形县", "山形縣"],
  ["fukushima", "福島県", "福岛县", "福島縣"],
  ["ibaraki", "茨城県", "茨城县", "茨城縣"],
  ["tochigi", "栃木県", "栃木县", "栃木縣"],
  ["gunma", "群馬県", "群马县", "群馬縣"],
  ["saitama", "埼玉県", "埼玉县", "埼玉縣"],
  ["chiba", "千葉県", "千叶县", "千葉縣"],
  ["tokyo", "東京都", "东京都", "東京都"],
  ["kanagawa", "神奈川県", "神奈川县", "神奈川縣"],
  ["niigata", "新潟県", "新潟县", "新潟縣"],
  ["toyama", "富山県", "富山县", "富山縣"],
  ["ishikawa", "石川県", "石川县", "石川縣"],
  ["fukui", "福井県", "福井县", "福井縣"],
  ["yamanashi", "山梨県", "山梨县", "山梨縣"],
  ["nagano", "長野県", "长野县", "長野縣"],
  ["gifu", "岐阜県", "岐阜县", "岐阜縣"],
  ["shizuoka", "静岡県", "静冈县", "靜岡縣"],
  ["aichi", "愛知県", "爱知县", "愛知縣"],
  ["mie", "三重県", "三重县", "三重縣"],
  ["shiga", "滋賀県", "滋贺县", "滋賀縣"],
  ["kyoto", "京都府", "京都府", "京都府"],
  ["osaka", "大阪府", "大阪府", "大阪府"],
  ["hyogo", "兵庫県", "兵库县", "兵庫縣"],
  ["nara", "奈良県", "奈良县", "奈良縣"],
  ["wakayama", "和歌山県", "和歌山县", "和歌山縣"],
  ["tottori", "鳥取県", "鸟取县", "鳥取縣"],
  ["shimane", "島根県", "岛根县", "島根縣"],
  ["okayama", "岡山県", "冈山县", "岡山縣"],
  ["hiroshima", "広島県", "广岛县", "廣島縣"],
  ["yamaguchi", "山口県", "山口县", "山口縣"],
  ["tokushima", "徳島県", "德岛县", "德島縣"],
  ["kagawa", "香川県", "香川县", "香川縣"],
  ["ehime", "愛媛県", "爱媛县", "愛媛縣"],
  ["kochi", "高知県", "高知县", "高知縣"],
  ["fukuoka", "福岡県", "福冈县", "福岡縣"],
  ["saga", "佐賀県", "佐贺县", "佐賀縣"],
  ["nagasaki", "長崎県", "长崎县", "長崎縣"],
  ["kumamoto", "熊本県", "熊本县", "熊本縣"],
  ["oita", "大分県", "大分县", "大分縣"],
  ["miyazaki", "宮崎県", "宫崎县", "宮崎縣"],
  ["kagoshima", "鹿児島県", "鹿儿岛县", "鹿兒島縣"],
  ["okinawa", "沖縄県", "冲绳县", "沖繩縣"],
];

const PREFIXES = PREFECTURE_NAMES.flatMap(([, ja, zh, tw]) => [ja, zh, tw])
  .concat(["东京", "東京"])
  .sort((a, b) => b.length - a.length);

const RESERVED = new Set(PREFIXES);

function stripPrefecture(name) {
  const text = String(name ?? "");
  for (const prefix of PREFIXES) {
    if (text.startsWith(prefix) && text.length > prefix.length) {
      return text.slice(prefix.length);
    }
  }
  return text;
}

function cityPrefix(name) {
  const match = /^(.+?市)/u.exec(name);
  return match?.[1] ?? "";
}

function shortEn(en) {
  const text = String(en ?? "").trim();
  if (!text || /[^\x00-\x7F]/u.test(text)) return "";
  const head = text.split(",")[0]?.trim() ?? "";
  if (!head || !/[A-Za-z]/u.test(head)) return "";
  return head;
}

const PREFECTURE_BY_CODE = {
  "01": "hokkaido",
  "02": "aomori",
  "03": "iwate",
  "04": "miyagi",
  "05": "akita",
  "06": "yamagata",
  "07": "fukushima",
  "08": "ibaraki",
  "09": "tochigi",
  10: "gunma",
  11: "saitama",
  12: "chiba",
  13: "tokyo",
  14: "kanagawa",
  15: "niigata",
  16: "toyama",
  17: "ishikawa",
  18: "fukui",
  19: "yamanashi",
  20: "nagano",
  21: "gifu",
  22: "shizuoka",
  23: "aichi",
  24: "mie",
  25: "shiga",
  26: "kyoto",
  27: "osaka",
  28: "hyogo",
  29: "nara",
  30: "wakayama",
  31: "tottori",
  32: "shimane",
  33: "okayama",
  34: "hiroshima",
  35: "yamaguchi",
  36: "tokushima",
  37: "kagawa",
  38: "ehime",
  39: "kochi",
  40: "fukuoka",
  41: "saga",
  42: "nagasaki",
  43: "kumamoto",
  44: "oita",
  45: "miyazaki",
  46: "kagoshima",
  47: "okinawa",
};

function prefIdOf(place) {
  const parts = String(place.slug ?? "").split("-");
  for (const part of parts) {
    if (PREFECTURE_NAMES.some((row) => row[0] === part)) return part;
  }
  return PREFECTURE_BY_CODE[String(place.code ?? "").slice(0, 2)] ?? "";
}

const raw = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "scripts/data/japan-municipalities.json"),
    "utf8",
  ),
);
const source = Array.isArray(raw.places) ? raw.places : [];

const places = [];
const groups = new Map();

for (const place of source) {
  const jaFull = String(place.ja ?? "");
  const zhFull = String(place.zh ?? "");
  const ja = stripPrefecture(jaFull);
  const zhSource = stripPrefecture(zhFull);
  const zh = mainland(zhSource || ja);
  const tw = toTw(zh);
  const en = shortEn(place.en);
  const pref = prefIdOf(place);
  const box = Array.isArray(place.bbox) ? place.bbox.slice(0, 4) : [0, 0, 0, 0];
  const record = { ja, zh, tw, en, pref, box };
  const index = places.length;
  places.push(record);

  const jaCity = cityPrefix(jaFull);
  const zhCity = cityPrefix(zhFull);
  if (jaCity && jaFull.includes("区") && en) {
    const key = `${pref}:${jaCity}`;
    const group = groups.get(key) ?? {
      ja: jaCity,
      zh: mainland(zhCity || jaCity),
      tw: toTw(mainland(zhCity || jaCity)),
      en,
      pref,
      box: box.slice(),
      ens: new Set(),
    };
    group.ens.add(en);
    group.box[0] = Math.min(group.box[0], box[0]);
    group.box[1] = Math.min(group.box[1], box[1]);
    group.box[2] = Math.max(group.box[2], box[2]);
    group.box[3] = Math.max(group.box[3], box[3]);
    groups.set(key, group);
  }
}

for (const group of groups.values()) {
  if (group.ens.size !== 1) continue;
  places.push({
    ja: group.ja,
    zh: group.zh,
    tw: group.tw,
    en: group.en,
    pref: group.pref,
    box: group.box,
  });
}

// Towns stored as 郡+町/村. The English field names the district, not the town,
// so en stays empty and the label falls back to the prefecture.
for (const place of source) {
  const jaFull = String(place.ja ?? "");
  const town = jaFull.replace(/^.*郡/u, "");
  if (!town || town === jaFull || !/[町村]$/u.test(town)) continue;
  const zh = mainland(town);
  places.push({
    ja: town,
    zh,
    tw: toTw(zh),
    en: "",
    pref: prefIdOf(place),
    box: Array.isArray(place.bbox) ? place.bbox.slice(0, 4) : [0, 0, 0, 0],
  });
}

const alias = {};
function addAlias(name, index) {
  const key = String(name ?? "").normalize("NFKC").trim();
  if (!key || RESERVED.has(key)) return;
  const list = alias[key] ?? [];
  if (!list.includes(index)) list.push(index);
  alias[key] = list;
}

places.forEach((place, index) => {
  const forms = new Set([
    place.ja,
    place.zh,
    place.tw,
    toCn(place.ja),
    toCn(place.zh),
    toTw(place.ja),
    toTw(place.zh),
    toTw(toCn(place.ja)),
  ]);
  for (const form of forms) addAlias(form, index);
});

// Subprefecture villages whose question labels use the village name alone.
const SHORT_VILLAGES = ["三宅支庁三宅村", "小笠原支庁小笠原村"];
for (const full of SHORT_VILLAGES) {
  const sourcePlace = source.find((place) => place.ja === full);
  if (!sourcePlace) continue;
  const ja = full.replace(/^.*庁/u, "");
  const zh = mainland(ja);
  places.push({
    ja,
    zh,
    tw: toTw(zh),
    en: "",
    pref: prefIdOf(sourcePlace),
    box: Array.isArray(sourcePlace.bbox)
      ? sourcePlace.bbox.slice(0, 4)
      : [0, 0, 0, 0],
  });
  const index = places.length - 1;
  addAlias(ja, index);
  addAlias(zh, index);
  addAlias(toTw(zh), index);
}

// Kanji spelling of the hiragana city name. Romaji still comes from the dataset.
const saitama = places.find(
  (place) => place.ja === "さいたま市" && place.pref === "saitama" && place.en,
);
if (saitama) addAlias("埼玉市", places.indexOf(saitama));

// Official hiragana names whose question labels use the kanji spelling.
// Display Chinese uses that spelling; romaji is copied from the dataset row.
const KANJI_FOR_KANA = [
  ["仁贺保市", "にかほ市"],
  ["宇流麻市", "うるま市"],
  ["筑波市", "つくば市"],
];
for (const [kanji, kana] of KANJI_FOR_KANA) {
  const sourcePlace = places.find((place) => place.ja === kana && place.en);
  if (!sourcePlace) continue;
  const zh = mainland(kanji);
  places.push({
    ja: kana,
    zh,
    tw: toTw(zh),
    en: sourcePlace.en,
    pref: sourcePlace.pref,
    box: sourcePlace.box,
  });
  const index = places.length - 1;
  addAlias(kanji, index);
  addAlias(zh, index);
  addAlias(toTw(zh), index);
  addAlias(kana, index);
}

// Question labels use a simplified spelling that OpenCC does not emit.
const SPELLING_ALIASES = [
  ["丰乡町", "豊郷町"],
  ["吉野之里町", "吉野ヶ里町"],
  ["外之滨町", "外ヶ浜町"],
];
for (const [label, ja] of SPELLING_ALIASES) {
  const index = places.findIndex((place) => place.ja === ja);
  if (index >= 0) addAlias(label, index);
}

const out = { places, alias };
const target = path.join(process.cwd(), "src/lib/japan-place-index.json");
writeFileSync(target, JSON.stringify(out));
console.log(
  `wrote ${places.length} places, ${Object.keys(alias).length} aliases, ${Buffer.byteLength(JSON.stringify(out))} bytes`,
);
