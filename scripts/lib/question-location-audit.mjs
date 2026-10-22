import * as OpenCC from "opencc-js";
import {
  distanceToOtherPrefecture,
  municipalitiesContaining,
  nearbyBoundaryDistances,
} from "./japan-area.mjs";

/** Simplified names already used by the question bank. */
export const PREFECTURES = [
  ["01", "北海道"],
  ["02", "青森县"],
  ["03", "岩手县"],
  ["04", "宫城县"],
  ["05", "秋田县"],
  ["06", "山形县"],
  ["07", "福岛县"],
  ["08", "茨城县"],
  ["09", "栃木县"],
  ["10", "群马县"],
  ["11", "埼玉县"],
  ["12", "千叶县"],
  ["13", "东京都"],
  ["14", "神奈川县"],
  ["15", "新潟县"],
  ["16", "富山县"],
  ["17", "石川县"],
  ["18", "福井县"],
  ["19", "山梨县"],
  ["20", "长野县"],
  ["21", "岐阜县"],
  ["22", "静冈县"],
  ["23", "爱知县"],
  ["24", "三重县"],
  ["25", "滋贺县"],
  ["26", "京都府"],
  ["27", "大阪府"],
  ["28", "兵库县"],
  ["29", "奈良县"],
  ["30", "和歌山县"],
  ["31", "鸟取县"],
  ["32", "岛根县"],
  ["33", "冈山县"],
  ["34", "广岛县"],
  ["35", "山口县"],
  ["36", "德岛县"],
  ["37", "香川县"],
  ["38", "爱媛县"],
  ["39", "高知县"],
  ["40", "福冈县"],
  ["41", "佐贺县"],
  ["42", "长崎县"],
  ["43", "熊本县"],
  ["44", "大分县"],
  ["45", "宫崎县"],
  ["46", "鹿儿岛县"],
  ["47", "冲绳县"],
];

const prefByCode = new Map(PREFECTURES);
const prefByName = new Map(PREFECTURES.map(([code, name]) => [name, code]));

const toSimplified = OpenCC.Converter({ from: "jp", to: "cn" });

/** Another prefecture this close counts as a border, not a clear interior. */
export const BORDER_METERS = 1000;
/** No municipality within this distance is outside Japan. */
export const OUTSIDE_METERS = 5000;

function simplifyAdminName(value) {
  return toSimplified(String(value ?? ""))
    .replaceAll("澁", "涩")
    .replaceAll("渋", "涩")
    .replaceAll("戸", "户")
    .replaceAll("鄕", "乡")
    .replaceAll("鄉", "乡")
    .replaceAll("郷", "乡")
    .replaceAll("竝", "并")
    .replaceAll("並", "并")
    .replaceAll("呉", "吴")
    .replaceAll("吳", "吴")
    .replaceAll("嶋", "岛")
    .replaceAll("豫", "予")
    .replaceAll("黒", "黑")
    .replaceAll("穂", "穗");
}

/**
 * Question-bank style label for one boundary polygon.
 * Tokyo wards stay as the ward. Designated-city wards collapse to the city.
 * A county prefix is dropped so 船井郡京丹波町 becomes 京丹波町.
 */
export function labelForMunicipality(place) {
  const name = simplifyAdminName(place.zh || place.ja);
  if (place.code.startsWith("13") && name.startsWith("东京都") && name.endsWith("区")) {
    return name.slice("东京都".length);
  }
  const city = /^(.+?市)/u.exec(name);
  if (city && name.endsWith("区") && name.length > city[1].length) return city[1];
  const office = /支厅(.+)$/u.exec(name);
  if (office) return office[1];
  const town = /郡(.+[町村])$/u.exec(name);
  if (town) return town[1];
  const pref = prefByCode.get(place.code.slice(0, 2));
  if (pref && name.startsWith(pref) && name.length > pref.length) return name.slice(pref.length);
  return name;
}

export function prefectureName(code) {
  return prefByCode.get(code) ?? code;
}

/**
 * @param {Array<{ code: string, ja: string, zh: string }>} places
 */
export function buildLabelIndex(places) {
  const byLabel = new Map();
  for (const place of places) {
    const label = labelForMunicipality(place);
    const pref = place.code.slice(0, 2);
    const prefs = byLabel.get(label) ?? new Set();
    prefs.add(pref);
    byLabel.set(label, prefs);
  }
  return byLabel;
}

export function resolveStoredLabel(label, byLabel) {
  const text = String(label ?? "").trim();
  if (prefByName.has(text)) {
    return { kind: "prefecture", pref: prefByName.get(text), name: text };
  }
  if (text === "日本") return { kind: "country" };
  const prefs = byLabel.get(text);
  if (!prefs) return { kind: "unresolved" };
  if (prefs.size > 1) return { kind: "ambiguous-label", prefs: [...prefs] };
  return { kind: "municipality", pref: [...prefs][0], name: text };
}

function agreedLabel(places) {
  const labels = new Set(places.map((place) => labelForMunicipality(place)));
  if (labels.size !== 1) return null;
  return [...labels][0];
}

/**
 * @returns {{ status: "clear" | "border" | "ambiguous" | "outside", pref: string | null, label: string | null, ja: string | null }}
 */
export function classifyCoordinate(lng, lat) {
  const empty = { status: "outside", pref: null, label: null, ja: null };
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return empty;

  const hits = municipalitiesContaining(lng, lat);
  const prefs = new Set(hits.map((place) => place.code.slice(0, 2)));
  if (prefs.size > 1) {
    return { status: "ambiguous", pref: null, label: null, ja: null };
  }

  if (hits.length > 0) {
    const pref = [...prefs][0];
    const label = agreedLabel(hits);
    if (!label) return { status: "ambiguous", pref, label: null, ja: null };
    const other = distanceToOtherPrefecture(lng, lat, pref);
    if (other <= BORDER_METERS) {
      return { status: "border", pref, label, ja: hits[0].ja };
    }
    return { status: "clear", pref, label, ja: hits[0].ja };
  }

  const near = nearbyBoundaryDistances(lng, lat);
  const nearest = near[0];
  if (!nearest || nearest.meters > OUTSIDE_METERS) return empty;
  const band = near.filter((item) => item.meters <= nearest.meters + BORDER_METERS);
  const nearPrefs = new Set(band.map((item) => item.place.code.slice(0, 2)));
  if (nearPrefs.size > 1) {
    return { status: "border", pref: null, label: null, ja: null };
  }
  return {
    status: "border",
    pref: nearest.place.code.slice(0, 2),
    label: labelForMunicipality(nearest.place),
    ja: nearest.place.ja,
  };
}

function bucketFor(resolved, point) {
  if (point.status === "outside") return "outside";
  if (point.status === "border") return "border";
  if (point.status === "ambiguous") return "ambiguous";
  if (resolved.kind !== "prefecture" && resolved.kind !== "municipality") {
    return "unresolved";
  }
  if (resolved.pref !== point.pref) return "prefecture-mismatch";
  if (resolved.kind === "municipality" && resolved.name !== point.label) {
    return "municipality-mismatch";
  }
  return "match";
}

/**
 * @param {Array<{ id: string, location: string, lat: number, lng: number }>} questions
 * @param {Map<string, Set<string>>} byLabel
 */
export function auditQuestionLocations(questions, byLabel) {
  const perLabel = new Map();
  const fixes = [];
  const unchanged = [];

  for (const question of questions) {
    const resolved = resolveStoredLabel(question.location, byLabel);
    const point = classifyCoordinate(question.lng, question.lat);
    const bucket = bucketFor(resolved, point);
    const row = perLabel.get(question.location) ?? {
      label: question.location,
      questions: 0,
      match: 0,
      municipalityMismatch: 0,
      prefectureMismatch: 0,
      outside: 0,
      border: 0,
      ambiguous: 0,
      unresolved: 0,
    };
    row.questions += 1;
    if (bucket === "match") row.match += 1;
    else if (bucket === "municipality-mismatch") row.municipalityMismatch += 1;
    else if (bucket === "prefecture-mismatch") row.prefectureMismatch += 1;
    else if (bucket === "outside") row.outside += 1;
    else if (bucket === "border") row.border += 1;
    else if (bucket === "ambiguous") row.ambiguous += 1;
    else row.unresolved += 1;
    perLabel.set(question.location, row);

    if (bucket === "prefecture-mismatch" && point.label && point.label !== question.location) {
      fixes.push({
        id: question.id,
        from: question.location,
        to: point.label,
        lat: question.lat,
        lng: question.lng,
        fromPrefecture: prefectureName(resolved.pref),
        toPrefecture: prefectureName(point.pref),
        municipality: point.ja,
      });
      continue;
    }

    if (bucket === "outside" || bucket === "border" || bucket === "ambiguous" || resolved.kind === "ambiguous-label") {
      unchanged.push({
        id: question.id,
        location: question.location,
        reason: resolved.kind === "ambiguous-label" && point.status === "clear" ? "ambiguous-label" : point.status,
        lat: question.lat,
        lng: question.lng,
      });
    }
  }

  const labels = [...perLabel.values()].sort((left, right) => {
    return right.prefectureMismatch - left.prefectureMismatch || right.questions - left.questions;
  });

  return { labels, fixes, unchanged };
}
