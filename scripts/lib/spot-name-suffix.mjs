import * as OpenCC from "opencc-js";
import {
  distanceToMunicipality,
  distanceToOtherMunicipality,
  locateMunicipality,
  municipalitiesContaining,
} from "./japan-area.mjs";
import { toZhTw } from "./zh-tw.mjs";

/** Same threshold as the question-label audit: clearly inside, not on the border. */
export const BORDER_METERS = 1000;
/** No municipality within this distance is outside Japan. */
export const OUTSIDE_METERS = 5000;

const toSimplified = OpenCC.Converter({ from: "jp", to: "cn" });

const PREFECTURE_JA = [
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

const TRAILING_ADMIN = /^(.*?)([（(])([^（）()]{1,48})([）)])$/u;

const NAME_FIELDS = [
  { field: "answerName", locale: "zh" },
  { field: "locales.ja.answerName", locale: "ja" },
  { field: "locales.en.answerName", locale: "en" },
];

export function normalizeAdminKey(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function cityStem(value) {
  const match = /^(.+?市)/u.exec(value ?? "");
  return match?.[1] && match[1] !== value ? match[1] : "";
}

/**
 * @param {Array<{ code: string, ja: string, zh: string, en: string }>} places
 */
export function buildAdminIndex(places) {
  const prefectures = new Map(
    PREFECTURE_JA.map(([code, ja, en]) => {
      const zh = toSimplified(ja);
      return [code, { code, ja, zh, en, tw: toZhTw(zh) }];
    }),
  );
  /** @type {Map<string, { kind: string, pref: string, style: string, codes: Set<string> }>} */
  const byName = new Map();
  const add = (name, entry) => {
    const key = normalizeAdminKey(name);
    if (!key || key.length < 2) return;
    const codes = new Set(entry.codes ?? []);
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, {
        kind: entry.kind,
        pref: entry.pref ?? "",
        style: entry.style,
        codes,
      });
      return;
    }
    if (prev.kind !== entry.kind) prev.kind = "ambiguous";
    for (const code of codes) prev.codes.add(code);
  };

  for (const pref of prefectures.values()) {
    add(pref.ja, { kind: "prefecture", pref: pref.code, style: "pref-ja" });
    add(pref.zh, { kind: "prefecture", pref: pref.code, style: "pref-zh" });
    add(pref.tw, { kind: "prefecture", pref: pref.code, style: "pref-tw" });
    add(pref.en, { kind: "prefecture", pref: pref.code, style: "pref-en" });
    add(`${pref.en} Prefecture`, {
      kind: "prefecture",
      pref: pref.code,
      style: "pref-en",
    });
  }

  for (const place of places) {
    const codes = [place.code];
    add(place.ja, { kind: "municipality", style: "ja", codes });
    add(place.zh, { kind: "municipality", style: "zh", codes });
    add(toSimplified(place.ja), { kind: "municipality", style: "zh", codes });
    add(toSimplified(place.zh), { kind: "municipality", style: "zh", codes });
    add(toZhTw(place.zh), { kind: "municipality", style: "tw", codes });
    add(place.en, { kind: "municipality", style: "en-full", codes });
    const short = place.en.split(",")[0]?.trim() ?? "";
    add(short, { kind: "municipality", style: "en", codes });
    add(`${short} City`, { kind: "municipality", style: "en-city", codes });
    add(`${short} Ward`, { kind: "municipality", style: "en-ward", codes });

    const pref = prefectures.get(place.code.slice(0, 2));
    if (
      pref &&
      place.ja.startsWith(pref.ja) &&
      place.ja.length > pref.ja.length
    ) {
      add(place.ja.slice(pref.ja.length), {
        kind: "municipality",
        style: "ja-short",
        codes,
      });
    }
    if (
      pref &&
      place.zh.startsWith(pref.zh) &&
      place.zh.length > pref.zh.length
    ) {
      const shortZh = place.zh.slice(pref.zh.length);
      add(shortZh, { kind: "municipality", style: "zh-short", codes });
      add(toZhTw(shortZh), { kind: "municipality", style: "tw-short", codes });
    }
    const jaCity = cityStem(place.ja);
    if (jaCity) add(jaCity, { kind: "municipality", style: "ja-city", codes });
    const zhCity = cityStem(toSimplified(place.zh));
    if (zhCity) {
      add(zhCity, { kind: "municipality", style: "zh-city", codes });
      add(toZhTw(zhCity), { kind: "municipality", style: "tw-city", codes });
    }
  }

  return { byName, prefectures };
}

export function parseTrailingAdmin(value) {
  const text = String(value ?? "").trim();
  const match = TRAILING_ADMIN.exec(text);
  if (!match) return null;
  const body = match[1] ?? "";
  const open = match[2] ?? "";
  const inner = (match[3] ?? "").trim();
  const close = match[4] ?? "";
  if (!inner || !body.trim()) return null;
  return { body, open, inner, close };
}

/**
 * Point clearly inside one municipality, or a reason to leave the name alone.
 * @returns {{ status: "clear" | "border" | "ambiguous" | "outside", place: import("./japan-area.mjs").Municipality | null, borderMeters: number }}
 */
export function classifyPoint(lng, lat) {
  const empty = { status: "outside", place: null, borderMeters: Infinity };
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return empty;
  const hits = municipalitiesContaining(lng, lat);
  const codes = new Set(hits.map((place) => place.code));
  if (codes.size > 1)
    return { status: "ambiguous", place: null, borderMeters: 0 };
  if (codes.size === 1) {
    const place = hits[0] ?? null;
    const borderMeters = distanceToOtherMunicipality(
      lng,
      lat,
      place?.code ?? "",
    );
    if (!place) return empty;
    if (borderMeters <= BORDER_METERS) {
      return { status: "border", place, borderMeters };
    }
    return { status: "clear", place, borderMeters };
  }
  const snapped = locateMunicipality(lng, lat);
  if (!snapped) return empty;
  const borderMeters = distanceToMunicipality(lng, lat, snapped);
  if (borderMeters > OUTSIDE_METERS) return empty;
  return { status: "border", place: snapped, borderMeters };
}

export function suffixMatchesPlace(resolved, place) {
  if (!resolved || resolved.kind === "ambiguous" || !place) return false;
  if (resolved.kind === "prefecture") {
    return place.code.slice(0, 2) === resolved.pref;
  }
  return resolved.codes.has(place.code);
}

function stripPref(value, pref) {
  if (pref && value.startsWith(pref) && value.length > pref.length) {
    return value.slice(pref.length);
  }
  return value;
}

export function adminLabelForField(
  place,
  resolved,
  locale,
  suffix,
  prefectures,
) {
  const pref = prefectures.get(place.code.slice(0, 2));
  const style = resolved?.style ?? "";
  if (resolved?.kind === "prefecture") {
    if (locale === "en") {
      const name = pref?.en ?? "";
      return /prefecture/iu.test(suffix) ? `${name} Prefecture` : name;
    }
    if (locale === "ja") return pref?.ja ?? "";
    return pref?.zh ?? "";
  }
  if (locale === "en") {
    if (suffix.includes(",")) return place.en;
    const short = place.en.split(",")[0]?.trim() || place.en;
    if (
      / city$/iu.test(suffix) &&
      /市/u.test(place.ja) &&
      !/郡/u.test(place.ja)
    ) {
      return `${short} City`;
    }
    if (/ ward$/iu.test(suffix) && /区$/u.test(place.ja))
      return `${short} Ward`;
    return short;
  }
  const city = style.endsWith("city");
  const shortName = style.endsWith("short");
  if (locale === "ja") {
    if (city) return cityStem(place.ja) || place.ja;
    if (shortName) return stripPref(place.ja, pref?.ja);
    return place.ja;
  }
  const zh = toSimplified(place.zh);
  if (city) return cityStem(zh) || zh;
  if (shortName) return stripPref(zh, pref?.zh);
  return zh;
}

export function adminLabel(place, style, prefectures) {
  const pref = prefectures.get(place.code.slice(0, 2));
  const shortEn = place.en.split(",")[0]?.trim() || place.en;
  if (style === "pref-ja") return pref?.ja ?? "";
  if (style === "pref-zh") return pref?.zh ?? "";
  if (style === "pref-tw") return pref?.tw ?? "";
  if (style === "pref-en") return pref?.en ?? "";
  if (style === "en") return shortEn;
  if (style === "en-city") return `${shortEn} City`;
  if (style === "en-ward") return `${shortEn} Ward`;
  if (style === "en-full") return place.en;
  if (style === "ja") return place.ja;
  if (style === "zh") return toSimplified(place.zh);
  if (style === "tw") return toZhTw(toSimplified(place.zh));
  if (style === "ja-short") return stripPref(place.ja, pref?.ja);
  if (style === "zh-short") return stripPref(toSimplified(place.zh), pref?.zh);
  if (style === "tw-short") {
    return toZhTw(stripPref(toSimplified(place.zh), pref?.zh));
  }
  if (style === "ja-city") return cityStem(place.ja) || place.ja;
  if (style === "zh-city")
    return cityStem(toSimplified(place.zh)) || toSimplified(place.zh);
  if (style === "tw-city") {
    return toZhTw(cityStem(toSimplified(place.zh)) || toSimplified(place.zh));
  }
  return place.ja;
}

export function rewriteAdminSuffix(value, label) {
  const parsed = parseTrailingAdmin(value);
  if (!parsed || !label) return value;
  return `${parsed.body}${parsed.open}${label}${parsed.close}`;
}

function readField(question, field) {
  if (field === "answerName") return question?.answerName;
  if (field === "locales.ja.answerName")
    return question?.locales?.ja?.answerName;
  if (field === "locales.en.answerName")
    return question?.locales?.en?.answerName;
  return undefined;
}

function writeField(question, field, value) {
  if (field === "answerName") question.answerName = value;
  else if (field === "locales.ja.answerName" && question.locales?.ja) {
    question.locales.ja.answerName = value;
  } else if (field === "locales.en.answerName" && question.locales?.en) {
    question.locales.en.answerName = value;
  }
}

function containingPlace(lng, lat) {
  const hits = municipalitiesContaining(lng, lat);
  const codes = new Set(hits.map((place) => place.code));
  if (codes.size > 1) return { status: "ambiguous", place: null };
  if (codes.size === 1) return { status: "inside", place: hits[0] ?? null };
  return { status: "miss", place: null };
}

function clearOrBorder(lng, lat, place) {
  const borderMeters = distanceToOtherMunicipality(lng, lat, place.code);
  if (borderMeters <= BORDER_METERS)
    return { status: "border", place, borderMeters };
  return { status: "clear", place, borderMeters };
}

/**
 * @param {Array<{ id: string, lat: number, lng: number, location?: string, answerName?: string, locales?: object }>} questions
 */
export function auditSpotNameSuffixes(questions, adminIndex) {
  const fixes = [];
  const left = [];
  let suffixed = 0;
  for (const question of questions) {
    if (!question?.id || typeof question.lat !== "number") continue;
    const candidates = [];
    for (const spec of NAME_FIELDS) {
      const current = readField(question, spec.field);
      if (typeof current !== "string" || !current.trim()) continue;
      const parsed = parseTrailingAdmin(current);
      if (!parsed) continue;
      const resolved = adminIndex.byName.get(normalizeAdminKey(parsed.inner));
      if (!resolved) continue;
      candidates.push({ spec, current, parsed, resolved });
    }
    if (candidates.length === 0) continue;
    suffixed += candidates.length;
    const contained = containingPlace(question.lng, question.lat);
    let decided = null;
    const decide = () => {
      if (decided) return decided;
      if (contained.status === "ambiguous") {
        decided = { status: "ambiguous", place: null, borderMeters: 0 };
      } else if (contained.status === "inside" && contained.place) {
        decided = clearOrBorder(question.lng, question.lat, contained.place);
      } else {
        const snapped = locateMunicipality(question.lng, question.lat);
        if (!snapped)
          decided = { status: "outside", place: null, borderMeters: Infinity };
        else {
          const borderMeters = distanceToMunicipality(
            question.lng,
            question.lat,
            snapped,
          );
          decided =
            borderMeters > OUTSIDE_METERS
              ? { status: "outside", place: null, borderMeters }
              : { status: "border", place: snapped, borderMeters };
        }
      }
      return decided;
    };
    for (const item of candidates) {
      const place =
        contained.status === "inside" ? contained.place : decide().place;
      if (
        item.resolved.kind !== "ambiguous" &&
        place &&
        suffixMatchesPlace(item.resolved, place) &&
        contained.status === "inside"
      ) {
        continue;
      }
      const point = decide();
      if (
        point.status === "clear" &&
        point.place &&
        item.resolved.kind !== "ambiguous" &&
        !suffixMatchesPlace(item.resolved, point.place)
      ) {
        const label = adminLabelForField(
          point.place,
          item.resolved,
          item.spec.locale,
          item.parsed.inner,
          adminIndex.prefectures,
        );
        const next = rewriteAdminSuffix(item.current, label);
        if (!label || next === item.current) continue;
        fixes.push({
          id: question.id,
          field: item.spec.field,
          locale: item.spec.locale,
          from: item.current,
          to: next,
          suffixFrom: item.parsed.inner,
          suffixTo: label,
          lat: question.lat,
          lng: question.lng,
          borderMeters: Math.round(point.borderMeters),
          municipality: point.place.ja,
          locationSlug: point.place.slug,
        });
        continue;
      }
      if (
        point.place &&
        item.resolved.kind !== "ambiguous" &&
        suffixMatchesPlace(item.resolved, point.place)
      ) {
        continue;
      }
      left.push({
        id: question.id,
        field: item.spec.field,
        name: item.current,
        suffix: item.parsed.inner,
        reason:
          item.resolved.kind === "ambiguous" ? "ambiguous-label" : point.status,
        lat: question.lat,
        lng: question.lng,
        borderMeters: Number.isFinite(point.borderMeters)
          ? Math.round(point.borderMeters)
          : null,
        municipality: point.place?.ja ?? "",
      });
    }
  }
  return { suffixed, fixes, left };
}

/**
 * Stored area text and coordinate membership. Does not decide a rewrite.
 * @param {Array<{ id: string, lat: number, lng: number, location?: string }>} questions
 */
export function auditStoredAreas(questions, adminIndex) {
  const labelMismatches = [];
  const membership = [];
  for (const question of questions) {
    if (!question?.id || typeof question.lat !== "number") continue;
    const contained = containingPlace(question.lng, question.lat);
    if (contained.status !== "inside" || !contained.place) continue;
    const stored = String(question.location ?? "").trim();
    const resolved = stored
      ? adminIndex.byName.get(normalizeAdminKey(stored))
      : null;
    const labelAgrees =
      resolved &&
      resolved.kind !== "ambiguous" &&
      suffixMatchesPlace(resolved, contained.place);
    if (labelAgrees || !resolved || resolved.kind === "ambiguous") continue;
    const point = clearOrBorder(question.lng, question.lat, contained.place);
    if (point.status !== "clear") continue;
    const snapped = locateMunicipality(question.lng, question.lat);
    if (snapped && snapped.code !== point.place.code) {
      membership.push({
        id: question.id,
        fromSlug: snapped.slug,
        toSlug: point.place.slug,
        from: snapped.ja,
        to: point.place.ja,
        lat: question.lat,
        lng: question.lng,
      });
    }
    labelMismatches.push({
      id: question.id,
      location: stored,
      municipality: point.place.ja,
      locationSlug: snapped?.slug ?? point.place.slug,
      lat: question.lat,
      lng: question.lng,
      borderMeters: Math.round(point.borderMeters),
    });
  }
  return { labelMismatches, membership };
}

export function applyNameFixes(questions, fixes) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  let applied = 0;
  for (const fix of fixes) {
    const question = byId.get(fix.id);
    if (!question) continue;
    if (readField(question, fix.field) !== fix.from) continue;
    writeField(question, fix.field, fix.to);
    applied += 1;
  }
  return applied;
}

export function spotPagePath(id) {
  return `/pilgrimage/spots/${encodeURIComponent(id)}`;
}

/** Pages whose visible name changes. Area membership is not one of them. */
export function pathsForNameFixes(fixes, spotsById) {
  const changed = new Set();
  const seen = new Set();
  for (const fix of fixes) {
    if (seen.has(fix.id)) continue;
    seen.add(fix.id);
    const spot = spotsById.get(fix.id);
    if (spot?.redirectTo) continue;
    changed.add(spotPagePath(fix.id));
    if (spot?.locationSlug)
      changed.add(`/pilgrimage/locations/${spot.locationSlug}`);
    if (spot?.subjectSlug) changed.add(`/pilgrimage/anime/${spot.subjectSlug}`);
  }
  return changed;
}
