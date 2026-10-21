/**
 * Homepage map pills. An area is one location slug. A prefecture is the
 * slug suffix (`kamakura-kanagawa`) or the first two digits of a JIS code.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, { ja: string, zh: string, tw: string, en: string }>} */
export const PREFECTURES = {
  hokkaido: { ja: "北海道", zh: "北海道", tw: "北海道", en: "Hokkaido" },
  aomori: { ja: "青森", zh: "青森", tw: "青森", en: "Aomori" },
  iwate: { ja: "岩手", zh: "岩手", tw: "岩手", en: "Iwate" },
  miyagi: { ja: "宮城", zh: "宫城", tw: "宮城", en: "Miyagi" },
  akita: { ja: "秋田", zh: "秋田", tw: "秋田", en: "Akita" },
  yamagata: { ja: "山形", zh: "山形", tw: "山形", en: "Yamagata" },
  fukushima: { ja: "福島", zh: "福岛", tw: "福島", en: "Fukushima" },
  ibaraki: { ja: "茨城", zh: "茨城", tw: "茨城", en: "Ibaraki" },
  tochigi: { ja: "栃木", zh: "栃木", tw: "栃木", en: "Tochigi" },
  gunma: { ja: "群馬", zh: "群马", tw: "群馬", en: "Gunma" },
  saitama: { ja: "埼玉", zh: "埼玉", tw: "埼玉", en: "Saitama" },
  chiba: { ja: "千葉", zh: "千叶", tw: "千葉", en: "Chiba" },
  tokyo: { ja: "東京", zh: "东京", tw: "東京", en: "Tokyo" },
  kanagawa: { ja: "神奈川", zh: "神奈川", tw: "神奈川", en: "Kanagawa" },
  niigata: { ja: "新潟", zh: "新潟", tw: "新潟", en: "Niigata" },
  toyama: { ja: "富山", zh: "富山", tw: "富山", en: "Toyama" },
  ishikawa: { ja: "石川", zh: "石川", tw: "石川", en: "Ishikawa" },
  fukui: { ja: "福井", zh: "福井", tw: "福井", en: "Fukui" },
  yamanashi: { ja: "山梨", zh: "山梨", tw: "山梨", en: "Yamanashi" },
  nagano: { ja: "長野", zh: "长野", tw: "長野", en: "Nagano" },
  gifu: { ja: "岐阜", zh: "岐阜", tw: "岐阜", en: "Gifu" },
  shizuoka: { ja: "静岡", zh: "静冈", tw: "靜岡", en: "Shizuoka" },
  aichi: { ja: "愛知", zh: "爱知", tw: "愛知", en: "Aichi" },
  mie: { ja: "三重", zh: "三重", tw: "三重", en: "Mie" },
  shiga: { ja: "滋賀", zh: "滋贺", tw: "滋賀", en: "Shiga" },
  kyoto: { ja: "京都", zh: "京都", tw: "京都", en: "Kyoto" },
  osaka: { ja: "大阪", zh: "大阪", tw: "大阪", en: "Osaka" },
  hyogo: { ja: "兵庫", zh: "兵库", tw: "兵庫", en: "Hyogo" },
  nara: { ja: "奈良", zh: "奈良", tw: "奈良", en: "Nara" },
  wakayama: { ja: "和歌山", zh: "和歌山", tw: "和歌山", en: "Wakayama" },
  tottori: { ja: "鳥取", zh: "鸟取", tw: "鳥取", en: "Tottori" },
  shimane: { ja: "島根", zh: "岛根", tw: "島根", en: "Shimane" },
  okayama: { ja: "岡山", zh: "冈山", tw: "岡山", en: "Okayama" },
  hiroshima: { ja: "広島", zh: "广岛", tw: "廣島", en: "Hiroshima" },
  yamaguchi: { ja: "山口", zh: "山口", tw: "山口", en: "Yamaguchi" },
  tokushima: { ja: "徳島", zh: "德岛", tw: "德島", en: "Tokushima" },
  kagawa: { ja: "香川", zh: "香川", tw: "香川", en: "Kagawa" },
  ehime: { ja: "愛媛", zh: "爱媛", tw: "愛媛", en: "Ehime" },
  kochi: { ja: "高知", zh: "高知", tw: "高知", en: "Kochi" },
  fukuoka: { ja: "福岡", zh: "福冈", tw: "福岡", en: "Fukuoka" },
  saga: { ja: "佐賀", zh: "佐贺", tw: "佐賀", en: "Saga" },
  nagasaki: { ja: "長崎", zh: "长崎", tw: "長崎", en: "Nagasaki" },
  kumamoto: { ja: "熊本", zh: "熊本", tw: "熊本", en: "Kumamoto" },
  oita: { ja: "大分", zh: "大分", tw: "大分", en: "Oita" },
  miyazaki: { ja: "宮崎", zh: "宫崎", tw: "宮崎", en: "Miyazaki" },
  kagoshima: { ja: "鹿児島", zh: "鹿儿岛", tw: "鹿兒島", en: "Kagoshima" },
  okinawa: { ja: "沖縄", zh: "冲绳", tw: "沖繩", en: "Okinawa" },
};

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

const AREA_MAJOR = 150;
const PREFECTURE_MAJOR = 1500;

/**
 * Japanese place shortening for area pills.
 * Strip a leading 東京都, rewrite 市+区, drop a 郡 before 町/村,
 * then drop a trailing 市 when the name is at least 3 characters.
 * @param {string} name
 */
export function shortJaAreaName(name) {
  let text = name.trim();
  if (text.startsWith("東京都") && text.length > "東京都".length) {
    text = text.slice("東京都".length);
  }
  const cityWard = /^(.+?)市(.+区)$/u.exec(text);
  if (cityWard) text = `${cityWard[1]}・${cityWard[2]}`;
  const county = /^(.+?郡)(.+[町村])$/u.exec(text);
  if (county) text = county[2];
  if ([...text].length >= 3 && text.endsWith("市")) {
    text = text.slice(0, -1);
  }
  return text || name.trim();
}

/** Ward names of designated cities, used only for English map pills. */
const WARD_ROMAJI = {
  上京区: "Kamigyo",
  下京区: "Shimogyo",
  中京区: "Nakagyo",
  中区: "Naka",
  中原区: "Nakahara",
  中央区: "Chuo",
  中村区: "Nakamura",
  伏見区: "Fushimi",
  住吉区: "Sumiyoshi",
  佐伯区: "Saeki",
  保土ケ谷区: "Hodogaya",
  八幡東区: "Yahatahigashi",
  八幡西区: "Yahatanishi",
  兵庫区: "Hyogo",
  北区: "Kita",
  千種区: "Chikusa",
  南区: "Minami",
  博多区: "Hakata",
  厚別区: "Atsubetsu",
  右京区: "Ukyo",
  垂水区: "Tarumi",
  城南区: "Jonan",
  多摩区: "Tama",
  大宮区: "Omiya",
  天王寺区: "Tennoji",
  天白区: "Tempaku",
  天竜区: "Tenryu",
  太白区: "Taihaku",
  宮前区: "Miyamae",
  宮城野区: "Miyagino",
  小倉北区: "Kokurakita",
  山科区: "Yamashina",
  岩槻区: "Iwatsuki",
  川崎区: "Kawasaki",
  左京区: "Sakyo",
  幸区: "Saiwai",
  戸塚区: "Totsuka",
  手稲区: "Teine",
  早良区: "Sawara",
  旭区: "Asahi",
  昭和区: "Showa",
  東住吉区: "Higashisumiyoshi",
  東区: "Higashi",
  東山区: "Higashiyama",
  東淀川区: "Higashiyodogawa",
  東灘区: "Higashinada",
  栄区: "Sakae",
  桜区: "Sakura",
  此花区: "Konohana",
  泉区: "Izumi",
  浦和区: "Urawa",
  浪速区: "Naniwa",
  淀川区: "Yodogawa",
  清水区: "Shimizu",
  清田区: "Kiyota",
  港北区: "Kohoku",
  港区: "Minato",
  港南区: "Konan",
  瀬谷区: "Seya",
  灘区: "Nada",
  熱田区: "Atsuta",
  瑞穂区: "Mizuho",
  白石区: "Shiroishi",
  磯子区: "Isogo",
  神奈川区: "Kanagawa",
  福島区: "Fukushima",
  稲毛区: "Inage",
  緑区: "Midori",
  美浜区: "Mihama",
  花見川区: "Hanamigawa",
  若林区: "Wakabayashi",
  葵区: "Aoi",
  西京区: "Nishikyo",
  西区: "Nishi",
  西成区: "Nishinari",
  西淀川区: "Nishiyodogawa",
  西蒲区: "Nishikan",
  豊平区: "Toyohira",
  都島区: "Miyakojima",
  都筑区: "Tsuzuki",
  金沢区: "Kanazawa",
  門司区: "Moji",
  阿倍野区: "Abeno",
  青葉区: "Aoba",
  須磨区: "Suma",
  駿河区: "Suruga",
  高津区: "Takatsu",
  鶴見区: "Tsurumi",
  麻生区: "Asao",
};

function cjkPrefecturePrefixes() {
  /** @type {string[]} */
  const prefixes = ["北海道"];
  for (const pref of Object.values(PREFECTURES)) {
    if (pref.ja === "北海道") continue;
    if (pref.ja === "東京") prefixes.push("東京都", "东京都");
    else if (pref.ja === "大阪") prefixes.push("大阪府");
    else if (pref.ja === "京都") prefixes.push("京都府");
    else prefixes.push(`${pref.ja}県`, `${pref.zh}县`, `${pref.tw}縣`);
  }
  return [...new Set(prefixes)].sort((a, b) => b.length - a.length);
}

const CJK_PREFECTURE_PREFIXES = cjkPrefecturePrefixes();

/**
 * zh / zh-tw map pills. Drop a leading prefecture, write a designated
 * city's ward as 市名・区, and drop a 郡 before a town or village.
 * A trailing 市 stays.
 * @param {string} name
 */
export function shortCjkAreaName(name) {
  let text = name.trim();
  for (const prefix of CJK_PREFECTURE_PREFIXES) {
    if (text.startsWith(prefix) && text.length > prefix.length) {
      text = text.slice(prefix.length);
      break;
    }
  }
  const cityWard = /^(.+?)市(.+[区區])$/u.exec(text);
  if (cityWard) text = `${cityWard[1]}・${cityWard[2]}`;
  const county = /^(.+?郡)(.+[町村])$/u.exec(text);
  if (county) text = county[2];
  return text || name.trim();
}

/**
 * English map pills. Drop the prefecture, a trailing place suffix, and a
 * district marker (“X District” or “-gun”). A designated-city ward keeps
 * the city and the ward: "Yokohama · Naka". `ja` is the unshortened
 * Japanese name, used only to find that ward.
 * @param {string} en
 * @param {string} [ja]
 */
export function shortEnAreaName(en, ja = "") {
  const source = en.trim();
  const city = stripEnDistrict(source.split(",")[0]?.trim() ?? "");
  const ward = /^(.+?)市(.+区)$/u.exec(ja.trim());
  const latin = /^[\p{Script=Latin}\d\s.'’-]+$/u.test(city);
  if (ward && latin && city) {
    const romaji = WARD_ROMAJI[ward[2]] ?? ward[2].replace(/区$/u, "");
    return `${stripEnPlaceSuffix(city)} · ${romaji}`;
  }
  return stripEnPlaceSuffix(city) || source;
}

/**
 * Drop “-gun”, and drop an “X District” phrase when a town name remains.
 * A segment that is only “X District” keeps X.
 * @param {string} name
 */
function stripEnDistrict(name) {
  const withoutGun = name.replace(/-gun\b/gi, "").replace(/\s{2,}/g, " ").trim();
  const withoutPhrase = withoutGun
    .replace(/\b[\p{Script=Latin}\d.'’-]+\s+District\b/giu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const outsideParens = withoutPhrase.replace(/\([^)]*\)/g, " ").trim();
  if (outsideParens && /[\p{Script=Latin}\d]/u.test(outsideParens)) {
    return withoutPhrase;
  }
  return withoutGun.replace(/\s+District\b/gi, "").replace(/\s{2,}/g, " ").trim();
}

/** @param {string} name */
function stripEnPlaceSuffix(name) {
  return name
    .replace(/\s+(City|Ward|Town|Village|District|Prefecture)$/iu, "")
    .trim();
}

/** @param {number[]} values */
export function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** @param {string} slug */
export function prefectureKey(slug) {
  const suffix = slug.split("-").at(-1) ?? "";
  if (PREFECTURES[suffix]) return suffix;
  if (/^\d{5}$/u.test(suffix)) {
    return PREFECTURE_BY_CODE[suffix.slice(0, 2)] ?? "";
  }
  return "";
}

function round5(value) {
  return Math.round(value * 1e5) / 1e5;
}

function filled(value) {
  const text = value?.trim() ?? "";
  return text || undefined;
}

/**
 * @param {string} locale
 * @param {string} id
 * @param {Record<string, Record<string, { name?: string }>> | undefined} overrides
 */
function overrideName(overrides, locale, id) {
  return filled(overrides?.[locale]?.[id]?.name);
}

/**
 * @param {{
 *   spots: Array<{ locationSlug: string, lng: number, lat: number }>,
 *   locations: Array<{ slug: string, name: { ja?: string, zh?: string, en?: string, tw?: string } }>,
 *   overrides?: Record<string, Record<string, { name?: string }>>,
 * }} input
 */
export function buildHomeMapLabels(input) {
  const overrides = input.overrides ?? {};
  const bySlug = new Map(input.locations.map((location) => [location.slug, location]));
  /** @type {Map<string, Array<{ lng: number, lat: number }>>} */
  const areaPoints = new Map();
  /** @type {Map<string, Array<{ lng: number, lat: number }>>} */
  const prefecturePoints = new Map();

  for (const spot of input.spots) {
    if (!Number.isFinite(spot.lng) || !Number.isFinite(spot.lat)) continue;
    const point = { lng: spot.lng, lat: spot.lat };
    const area = areaPoints.get(spot.locationSlug) ?? [];
    area.push(point);
    areaPoints.set(spot.locationSlug, area);
    const prefecture = prefectureKey(spot.locationSlug);
    if (!prefecture) continue;
    const group = prefecturePoints.get(prefecture) ?? [];
    group.push(point);
    prefecturePoints.set(prefecture, group);
  }

  const areas = [...areaPoints.entries()].map(([id, points]) => {
    const location = bySlug.get(id);
    const jaSource = filled(location?.name.ja) || filled(location?.name.zh) || id;
    const jaShort = shortJaAreaName(jaSource);
    const zhSource = filled(location?.name.zh);
    const twSource = filled(location?.name.tw) ?? zhSource;
    const enSource = filled(location?.name.en);
    const names = {
      ja: overrideName(overrides, "ja", id) ?? jaShort,
      zh: overrideName(overrides, "zh", id) ?? (zhSource ? shortCjkAreaName(zhSource) : jaShort),
      tw:
        overrideName(overrides, "zh-tw", id) ??
        (twSource ? shortCjkAreaName(twSource) : jaShort),
      en:
        overrideName(overrides, "en", id) ??
        (enSource ? shortEnAreaName(enSource, jaSource) : jaShort),
    };
    return labelFromPoints(id, names, points, AREA_MAJOR);
  });

  const prefectures = [...prefecturePoints.entries()].map(([id, points]) => {
    const base = PREFECTURES[id] ?? { ja: id, zh: id, tw: id, en: id };
    const names = {
      ja: overrideName(overrides, "ja", id) ?? base.ja,
      zh: overrideName(overrides, "zh", id) ?? base.zh,
      tw: overrideName(overrides, "zh-tw", id) ?? base.tw,
      en: overrideName(overrides, "en", id) ?? base.en,
    };
    return labelFromPoints(id, names, points, PREFECTURE_MAJOR);
  });

  areas.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  prefectures.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  return { version: 1, areas, prefectures };
}

function labelFromPoints(id, names, points, majorAt) {
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  return {
    id,
    ...names,
    count: points.length,
    lng: round5(median(lngs)),
    lat: round5(median(lats)),
    west: round5(Math.min(...lngs)),
    south: round5(Math.min(...lats)),
    east: round5(Math.max(...lngs)),
    north: round5(Math.max(...lats)),
    major: points.length >= majorAt,
  };
}

export function loadAreaNameOverrides() {
  const file = path.join(HERE, "../data/area-name-overrides.json");
  return JSON.parse(readFileSync(file, "utf8"));
}
