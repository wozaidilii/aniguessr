import indexJson from "~/lib/japan-place-index.json";

export type PlaceLocale = "ja" | "zh" | "zh-tw" | "en";

/**
 * All 47 prefectures plus the country. English names are the short forms
 * (Tokyo, Kyoto, Osaka), not "Metropolis" / "Prefecture".
 * Chinese forms use the standard admin suffix: 都 / 道 / 府 / 县 / 縣.
 */
export const JAPAN_PREFECTURES = [
  { id: "hokkaido", ja: "北海道", zh: "北海道", tw: "北海道", en: "Hokkaido" },
  { id: "aomori", ja: "青森県", zh: "青森县", tw: "青森縣", en: "Aomori" },
  { id: "iwate", ja: "岩手県", zh: "岩手县", tw: "岩手縣", en: "Iwate" },
  { id: "miyagi", ja: "宮城県", zh: "宫城县", tw: "宮城縣", en: "Miyagi" },
  { id: "akita", ja: "秋田県", zh: "秋田县", tw: "秋田縣", en: "Akita" },
  { id: "yamagata", ja: "山形県", zh: "山形县", tw: "山形縣", en: "Yamagata" },
  { id: "fukushima", ja: "福島県", zh: "福岛县", tw: "福島縣", en: "Fukushima" },
  { id: "ibaraki", ja: "茨城県", zh: "茨城县", tw: "茨城縣", en: "Ibaraki" },
  { id: "tochigi", ja: "栃木県", zh: "栃木县", tw: "栃木縣", en: "Tochigi" },
  { id: "gunma", ja: "群馬県", zh: "群马县", tw: "群馬縣", en: "Gunma" },
  { id: "saitama", ja: "埼玉県", zh: "埼玉县", tw: "埼玉縣", en: "Saitama" },
  { id: "chiba", ja: "千葉県", zh: "千叶县", tw: "千葉縣", en: "Chiba" },
  { id: "tokyo", ja: "東京都", zh: "东京都", tw: "東京都", en: "Tokyo" },
  { id: "kanagawa", ja: "神奈川県", zh: "神奈川县", tw: "神奈川縣", en: "Kanagawa" },
  { id: "niigata", ja: "新潟県", zh: "新潟县", tw: "新潟縣", en: "Niigata" },
  { id: "toyama", ja: "富山県", zh: "富山县", tw: "富山縣", en: "Toyama" },
  { id: "ishikawa", ja: "石川県", zh: "石川县", tw: "石川縣", en: "Ishikawa" },
  { id: "fukui", ja: "福井県", zh: "福井县", tw: "福井縣", en: "Fukui" },
  { id: "yamanashi", ja: "山梨県", zh: "山梨县", tw: "山梨縣", en: "Yamanashi" },
  { id: "nagano", ja: "長野県", zh: "长野县", tw: "長野縣", en: "Nagano" },
  { id: "gifu", ja: "岐阜県", zh: "岐阜县", tw: "岐阜縣", en: "Gifu" },
  { id: "shizuoka", ja: "静岡県", zh: "静冈县", tw: "靜岡縣", en: "Shizuoka" },
  { id: "aichi", ja: "愛知県", zh: "爱知县", tw: "愛知縣", en: "Aichi" },
  { id: "mie", ja: "三重県", zh: "三重县", tw: "三重縣", en: "Mie" },
  { id: "shiga", ja: "滋賀県", zh: "滋贺县", tw: "滋賀縣", en: "Shiga" },
  { id: "kyoto", ja: "京都府", zh: "京都府", tw: "京都府", en: "Kyoto" },
  { id: "osaka", ja: "大阪府", zh: "大阪府", tw: "大阪府", en: "Osaka" },
  { id: "hyogo", ja: "兵庫県", zh: "兵库县", tw: "兵庫縣", en: "Hyogo" },
  { id: "nara", ja: "奈良県", zh: "奈良县", tw: "奈良縣", en: "Nara" },
  { id: "wakayama", ja: "和歌山県", zh: "和歌山县", tw: "和歌山縣", en: "Wakayama" },
  { id: "tottori", ja: "鳥取県", zh: "鸟取县", tw: "鳥取縣", en: "Tottori" },
  { id: "shimane", ja: "島根県", zh: "岛根县", tw: "島根縣", en: "Shimane" },
  { id: "okayama", ja: "岡山県", zh: "冈山县", tw: "岡山縣", en: "Okayama" },
  { id: "hiroshima", ja: "広島県", zh: "广岛县", tw: "廣島縣", en: "Hiroshima" },
  { id: "yamaguchi", ja: "山口県", zh: "山口县", tw: "山口縣", en: "Yamaguchi" },
  { id: "tokushima", ja: "徳島県", zh: "德岛县", tw: "德島縣", en: "Tokushima" },
  { id: "kagawa", ja: "香川県", zh: "香川县", tw: "香川縣", en: "Kagawa" },
  { id: "ehime", ja: "愛媛県", zh: "爱媛县", tw: "愛媛縣", en: "Ehime" },
  { id: "kochi", ja: "高知県", zh: "高知县", tw: "高知縣", en: "Kochi" },
  { id: "fukuoka", ja: "福岡県", zh: "福冈县", tw: "福岡縣", en: "Fukuoka" },
  { id: "saga", ja: "佐賀県", zh: "佐贺县", tw: "佐賀縣", en: "Saga" },
  { id: "nagasaki", ja: "長崎県", zh: "长崎县", tw: "長崎縣", en: "Nagasaki" },
  { id: "kumamoto", ja: "熊本県", zh: "熊本县", tw: "熊本縣", en: "Kumamoto" },
  { id: "oita", ja: "大分県", zh: "大分县", tw: "大分縣", en: "Oita" },
  { id: "miyazaki", ja: "宮崎県", zh: "宫崎县", tw: "宮崎縣", en: "Miyazaki" },
  { id: "kagoshima", ja: "鹿児島県", zh: "鹿儿岛县", tw: "鹿兒島縣", en: "Kagoshima" },
  { id: "okinawa", ja: "沖縄県", zh: "冲绳县", tw: "沖繩縣", en: "Okinawa" },
] as const;

const JAPAN = { ja: "日本", zh: "日本", tw: "日本", en: "Japan" } as const;

interface PlaceRecord {
  ja: string;
  zh: string;
  tw: string;
  en: string;
  pref: string;
  box: [number, number, number, number];
}

interface PlaceIndex {
  places: PlaceRecord[];
  alias: Record<string, number[]>;
}

const index = indexJson as unknown as PlaceIndex;
const places = index.places;
const alias = index.alias;

const prefectureById = new Map<string, (typeof JAPAN_PREFECTURES)[number]>(
  JAPAN_PREFECTURES.map((row) => [row.id, row]),
);

const prefectureKeys = new Map<string, (typeof JAPAN_PREFECTURES)[number]>();
for (const row of JAPAN_PREFECTURES) {
  for (const key of [row.ja, row.zh, row.tw, row.en, row.en.toLowerCase()]) {
    prefectureKeys.set(key, row);
  }
}

const PREFIXES = [...prefectureKeys.keys()]
  .filter((key) => key.length > 1)
  .concat(["东京", "東京"])
  .sort((a, b) => b.length - a.length);

export type PlaceMatchKind =
  | "country"
  | "prefecture"
  | "municipality"
  | "prefecture-fallback"
  | "unmatched";

export interface PlaceMatch {
  kind: PlaceMatchKind;
  label: string;
}

function normalize(value: string): string {
  return value.normalize("NFKC").trim();
}

function labelOf(
  row: { ja: string; zh: string; tw: string; en: string },
  locale: PlaceLocale,
): string {
  if (locale === "en") return row.en;
  if (locale === "zh") return row.zh;
  if (locale === "zh-tw") return row.tw;
  return row.ja;
}

function prefectureLabel(id: string, locale: PlaceLocale): string | null {
  const row = prefectureById.get(id);
  return row ? labelOf(row, locale) : null;
}

function inBox(
  box: [number, number, number, number],
  point: { lat: number; lng: number },
): boolean {
  const [minLng, minLat, maxLng, maxLat] = box;
  return (
    point.lng >= minLng &&
    point.lng <= maxLng &&
    point.lat >= minLat &&
    point.lat <= maxLat
  );
}

function sameDisplay(rows: PlaceRecord[]): boolean {
  const first = rows[0];
  if (!first) return false;
  return rows.every(
    (row) =>
      row.ja === first.ja &&
      row.zh === first.zh &&
      row.tw === first.tw &&
      row.en === first.en &&
      row.pref === first.pref,
  );
}

function resolvePlaces(
  rows: PlaceRecord[],
  point?: { lat: number; lng: number },
): PlaceRecord | { pref: string } | null {
  if (rows.length === 0) return null;
  let pool = rows;
  if (point) {
    const inside = pool.filter((row) => inBox(row.box, point));
    if (inside.length > 0) pool = inside;
  }
  if (pool.length === 1 || sameDisplay(pool)) return pool[0] ?? null;
  const prefs = new Set(pool.map((row) => row.pref).filter(Boolean));
  if (prefs.size === 1) return { pref: [...prefs][0] ?? "" };
  return null;
}

function municipalityMatch(
  rows: PlaceRecord[],
  locale: PlaceLocale,
  point?: { lat: number; lng: number },
): PlaceMatch | null {
  const resolved = resolvePlaces(rows, point);
  if (!resolved) return null;
  if ("pref" in resolved && !("ja" in resolved)) {
    const label = prefectureLabel(resolved.pref, locale);
    return label ? { kind: "prefecture-fallback", label } : null;
  }
  if (locale === "en" && !resolved.en) {
    const label = prefectureLabel(resolved.pref, locale);
    return label ? { kind: "prefecture-fallback", label } : null;
  }
  return { kind: "municipality", label: labelOf(resolved, locale) };
}

function splitPrefecture(text: string): { pref: string; rest: string } | null {
  for (const prefix of PREFIXES) {
    if (!text.startsWith(prefix) || text.length === prefix.length) continue;
    const row =
      prefectureKeys.get(prefix) ??
      (prefix === "东京" || prefix === "東京"
        ? prefectureById.get("tokyo")
        : undefined);
    if (!row) continue;
    return { pref: row.id, rest: text.slice(prefix.length) };
  }
  return null;
}

/** Localize one stored place label. Unknown municipalities are not romanized. */
export function matchPlaceName(
  raw: string,
  locale: PlaceLocale,
  point?: { lat: number; lng: number },
): PlaceMatch {
  const text = normalize(raw);
  if (!text) return { kind: "unmatched", label: raw };
  if (text === "日本" || text === "日本国" || text.toLowerCase() === "japan") {
    return { kind: "country", label: labelOf(JAPAN, locale) };
  }
  const prefecture = prefectureKeys.get(text);
  if (prefecture) {
    return { kind: "prefecture", label: labelOf(prefecture, locale) };
  }
  const exact = alias[text];
  if (exact) {
    const rows = exact
      .map((id) => places[id])
      .filter((row): row is PlaceRecord => Boolean(row));
    const matched = municipalityMatch(rows, locale, point);
    if (matched) return matched;
  }
  const split = splitPrefecture(text);
  if (split) {
    const inner = alias[split.rest];
    const rows = (inner ?? [])
      .map((id) => places[id])
      .filter((row): row is PlaceRecord => Boolean(row))
      .filter((row) => row.pref === split.pref);
    const matched = municipalityMatch(
      rows.length > 0 ? rows : [],
      locale,
      point,
    );
    if (matched) return matched;
    const label = prefectureLabel(split.pref, locale);
    if (label) return { kind: "prefecture-fallback", label };
  }
  const shortCity = text.endsWith("市") ? text.slice(0, -1) : "";
  if (shortCity && prefectureKeys.get(shortCity)) {
    const row = prefectureKeys.get(shortCity);
    if (row) return { kind: "prefecture-fallback", label: labelOf(row, locale) };
  }
  return { kind: "unmatched", label: text };
}

export function localizePlaceName(
  raw: string,
  locale: PlaceLocale,
  point?: { lat: number; lng: number },
): string {
  return matchPlaceName(raw, locale, point).label;
}

export interface PlaceCoverage {
  questions: number;
  uniqueLabels: number;
  byKind: Record<PlaceMatchKind, { labels: number; questions: number }>;
  unmatchedLabels: string[];
}

/** Coverage of stored question locations. One coordinate may disambiguate a name. */
export function summarizePlaceCoverage(
  rows: ReadonlyArray<{ location: string; lat?: number; lng?: number }>,
): PlaceCoverage {
  const byKind: PlaceCoverage["byKind"] = {
    country: { labels: 0, questions: 0 },
    prefecture: { labels: 0, questions: 0 },
    municipality: { labels: 0, questions: 0 },
    "prefecture-fallback": { labels: 0, questions: 0 },
    unmatched: { labels: 0, questions: 0 },
  };
  const grouped = new Map<string, { lat?: number; lng?: number; count: number }>();
  for (const row of rows) {
    const key = normalize(row.location);
    const current = grouped.get(key) ?? { count: 0 };
    current.count += 1;
    if (current.lat === undefined && row.lat !== undefined) {
      current.lat = row.lat;
      current.lng = row.lng;
    }
    grouped.set(key, current);
  }
  const unmatchedLabels: string[] = [];
  for (const [label, info] of grouped) {
    const point =
      info.lat !== undefined && info.lng !== undefined
        ? { lat: info.lat, lng: info.lng }
        : undefined;
    const kind = matchPlaceName(label, "en", point).kind;
    const bucket = byKind[kind];
    bucket.labels += 1;
    bucket.questions += info.count;
    if (kind === "unmatched") unmatchedLabels.push(label);
  }
  unmatchedLabels.sort();
  return {
    questions: rows.length,
    uniqueLabels: grouped.size,
    byKind,
    unmatchedLabels,
  };
}
