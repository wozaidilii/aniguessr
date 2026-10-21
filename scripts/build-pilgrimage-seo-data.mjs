import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  loadMunicipalities,
  locateMunicipality,
  municipalityTouchesSea,
} from "./lib/japan-area.mjs";
import {
  chooseCanonicalSpot,
  chooseCanonicalSubject,
  cleanString,
  clusterWithinMeters,
  groupSubjects,
  haversineMeters,
  isButaSubject,
  localizedField,
  localizedList,
} from "./lib/pilgrimage-group.mjs";
import {
  buildHomeMapLabels,
  loadAreaNameOverrides,
} from "./lib/home-map-labels.mjs";
import { zhTwAnimeTitle } from "./lib/zh-tw-anime-title.mjs";
import { reviewCsv, reviewRow } from "./lib/zh-tw-review.mjs";
import { toZhTw } from "./lib/zh-tw.mjs";
import {
  buildLocalizedSitemapEntries,
  buildSitemapIndexXml,
  buildUrlSetXml,
  chunkSitemapPaths,
  resolveSiteOrigin,
  rightsSitemapItem,
  sitemapEntryCount,
} from "./lib/sitemap-xml.mjs";

const SOURCE_PATH = path.join(
  process.cwd(),
  "public/data/anime-guessr-questions.json",
);
const AREA_PATH = path.join(
  process.cwd(),
  "scripts/data/japan-municipalities.json",
);
const OUTPUT_DIR = path.join(process.cwd(), "public/data/seo");
const NAV_PATH = path.join(OUTPUT_DIR, "spots-nav.json");
const HOME_LABELS_PATH = path.join(OUTPUT_DIR, "home-map-labels.json");
const SITEMAP_DIR = path.join(process.cwd(), "public/sitemaps");

const PUBLIC_ROUTES = [
  ["/", 1],
  ["/pilgrimage", 0.95],
  ["/pilgrimage/anime", 0.9],
  ["/pilgrimage/locations", 0.9],
  ["/game", 0.85],
  ["/game/anime", 0.85],
  ["/game/anime-tuxun", 0.8],
  ["/game/tuxun", 0.7],
  ["/game/foreign", 0.7],
  ["/game/solo", 0.7],
  ["/game/history-year", 0.6],
  ["/game/history-tuxun", 0.6],
  ["/character", 0.6],
  ["/login", 0.3],
  ["/privacy", 0.4],
];

function subjectIdFromQuestion(question) {
  const tag = (question.tags ?? []).find((item) =>
    String(item).startsWith("subject:"),
  );
  if (tag) return String(tag).slice("subject:".length);
  const match = /^anitabi_(\d+)_/u.exec(question.id ?? "");
  return match?.[1] ?? null;
}

function slugifyAnime(subjectId, animeTitle) {
  const trimmed = String(animeTitle ?? "").trim();
  const suffix = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return suffix ? `${subjectId}-${suffix}` : `anime-${subjectId}`;
}

function mode(counter) {
  let best = "";
  let count = -1;
  for (const [value, times] of counter) {
    if (times > count || (times === count && value < best)) {
      best = value;
      count = times;
    }
  }
  return best;
}

function bump(counter, value) {
  const text = cleanString(value);
  if (!text) return;
  counter.set(text, (counter.get(text) ?? 0) + 1);
}

function missingText(value) {
  if (Array.isArray(value)) return value.length === 0;
  return !cleanString(value);
}

function coreLabel(value) {
  return String(value ?? "").replace(/[都道府県市区町村郡]/g, "");
}

function isPrefectureLabel(label) {
  if (!label || /[市区町村郡]/.test(label)) return false;
  return label === "北海道" || /[都府県県]$/u.test(label);
}

function labelMatchesPlace(label, place) {
  if (!label || !place) return false;
  if (place.zh === label || place.ja === label) return true;
  if (place.zh.endsWith(label) || place.ja.endsWith(label)) return true;
  const oldCore = coreLabel(label);
  if (oldCore.length < 2) return false;
  return coreLabel(place.zh) === oldCore || coreLabel(place.ja) === oldCore;
}

function enoshimaBlob(question) {
  const parts = [
    question.answerName,
    question.title,
    question.description,
    ...(question.funfact ?? []),
    question.locales?.ja?.answerName,
    question.locales?.ja?.title,
    question.locales?.en?.answerName,
    question.locales?.en?.title,
  ];
  return parts.filter(Boolean).join(" ");
}

const ENO_PATTERN =
  /江之岛|江ノ島|江の島|江岛|Enoshima|enoshima|片濑江|片瀬江/u;

function mostCommon(counter) {
  return mode(counter);
}

async function main() {
  loadMunicipalities(AREA_PATH);
  const payload = JSON.parse(await readFile(SOURCE_PATH, "utf8"));
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];

  const translationGaps = {
    animeTitle: { en: 0, ja: 0 },
    location: { en: 0, ja: 0 },
    answerName: { en: 0, ja: 0 },
    title: { en: 0, ja: 0 },
    description: { en: 0, ja: 0 },
    funfact: { en: 0, ja: 0 },
    episodeContext: { en: 0, ja: 0 },
  };

  /** @type {Map<string, any>} */
  const subjectDrafts = new Map();
  const prepared = [];

  for (const question of questions) {
    if (!question?.id || typeof question.lat !== "number") continue;
    for (const field of Object.keys(translationGaps)) {
      if (missingText(question.locales?.en?.[field]))
        translationGaps[field].en += 1;
      if (missingText(question.locales?.ja?.[field]))
        translationGaps[field].ja += 1;
    }

    const subjectId = subjectIdFromQuestion(question) ?? "unknown";
    const animeTitle = localizedField(question, "animeTitle");
    const place = locateMunicipality(question.lng, question.lat);
    const area = place
      ? {
          zh: place.zh,
          ja: place.ja,
          en: place.en,
          slug: place.slug,
          code: place.code,
        }
      : { zh: "日本", ja: "日本", en: "Japan", slug: "japan", code: "" };

    if (!subjectDrafts.has(subjectId)) {
      subjectDrafts.set(subjectId, {
        subjectId,
        titles: { zh: new Map(), ja: new Map(), en: new Map() },
        year: null,
        spotCount: 0,
      });
    }
    const draft = subjectDrafts.get(subjectId);
    draft.spotCount += 1;
    bump(draft.titles.zh, animeTitle.zh || question.animeTitle);
    bump(draft.titles.ja, animeTitle.ja);
    bump(draft.titles.en, animeTitle.en);
    if (Number.isFinite(question.year)) {
      draft.year =
        draft.year === null
          ? question.year
          : Math.min(draft.year, question.year);
    }

    prepared.push({
      question,
      subjectId,
      animeTitle,
      area,
      oldLocation: cleanString(question.location),
      enoshimaNamed: ENO_PATTERN.test(
        `${enoshimaBlob(question)}\n${cleanString(question.location)}`,
      ),
    });
  }

  const subjects = [...subjectDrafts.values()].map((draft) => ({
    subjectId: draft.subjectId,
    titles: {
      zh: mostCommon(draft.titles.zh),
      ja: mostCommon(draft.titles.ja),
      en: mostCommon(draft.titles.en),
    },
    year: draft.year,
    spotCount: draft.spotCount,
  }));

  const workGroups = groupSubjects(subjects);
  /** @type {Map<string, any>} */
  const workBySubject = new Map();
  const animes = [];
  const mergedGroups = [];

  for (const members of workGroups) {
    const canonical = chooseCanonicalSubject(members);
    const slug = slugifyAnime(canonical.subjectId, canonical.titles.zh);
    const work = {
      subjectId: canonical.subjectId,
      subjectIds: members.map((member) => member.subjectId).sort(),
      slug,
      animeTitle: {
        zh: canonical.titles.zh,
        ja: canonical.titles.ja,
        en: canonical.titles.en,
      },
      years: [
        ...new Set(members.map((member) => member.year).filter((year) => year)),
      ].sort((a, b) => a - b),
      members,
    };
    animes.push(work);
    for (const member of members) workBySubject.set(member.subjectId, work);
    if (members.length > 1) {
      mergedGroups.push({
        slug,
        canonicalSubjectId: canonical.subjectId,
        subjects: members.map((member) => ({
          subjectId: member.subjectId,
          zh: member.titles.zh,
          ja: member.titles.ja,
          en: member.titles.en,
          spots: member.spotCount,
          slug: slugifyAnime(member.subjectId, member.titles.zh),
        })),
      });
    }
  }

  /** @type {Record<string, any>} */
  const spots = {};
  /** @type {Map<string, any[]>} */
  const spotsByWork = new Map();

  for (const item of prepared) {
    const work = workBySubject.get(item.subjectId);
    const spot = {
      id: item.question.id,
      subjectId: item.subjectId,
      workSubjectId: work.subjectId,
      subjectSlug: work.slug,
      locationSlug: item.area.slug,
      areaCode: item.area.code,
      lat: item.question.lat,
      lng: item.question.lng,
      year: item.question.year ?? null,
      difficulty: item.question.difficulty ?? null,
      confidence: item.question.confidence ?? "unknown",
      imagePath: item.question.imagePath ?? null,
      sourceUrl: item.question.sourceUrl ?? null,
      title: localizedField(item.question, "title"),
      description: localizedField(item.question, "description"),
      animeTitle: item.animeTitle,
      location: { zh: item.area.zh, ja: item.area.ja, en: item.area.en },
      answerName: localizedField(item.question, "answerName"),
      aspect: item.question.aspect ?? null,
      episodeContext: localizedField(item.question, "episodeContext"),
      funfact: localizedList(item.question, "funfact"),
      oldLocation: item.oldLocation,
      enoshimaNamed: item.enoshimaNamed,
      redirectTo: null,
    };
    spots[spot.id] = spot;
    const list = spotsByWork.get(work.subjectId);
    if (list) list.push(spot);
    else spotsByWork.set(work.subjectId, [spot]);
  }

  let tenMeterGroups = 0;
  let redirectedSpots = 0;
  let butaTenMeterGroups = 0;
  for (const [workId, workSpots] of spotsByWork) {
    const clusters = clusterWithinMeters(workSpots, 10);
    const work = workBySubject.get(workSpots[0]?.subjectId);
    if (work && isButaSubject({ titles: work.animeTitle })) {
      butaTenMeterGroups += clusters.length;
    }
    tenMeterGroups += clusters.length;
    for (const cluster of clusters) {
      const canonical = chooseCanonicalSpot(cluster);
      for (const spot of cluster) {
        if (spot.id === canonical.id) continue;
        spot.redirectTo = canonical.id;
        redirectedSpots += 1;
      }
    }
  }

  const visibleSpots = Object.values(spots).filter((spot) => !spot.redirectTo);
  const bocchiSubjectIds = new Set(
    subjects
      .filter((subject) =>
        /ぼっち・ざ・ろっく|bocchi the rock|孤独摇滚|孤獨搖滾/i.test(
          `${subject.titles.ja}\n${subject.titles.en}\n${subject.titles.zh}`,
        ),
      )
      .map((subject) => subject.subjectId),
  );

  /** @type {Map<string, any>} */
  const locationMap = new Map();
  /** @type {Map<string, Map<string, number>>} */
  const oldLabelTargets = new Map();
  const areaStats = {
    zhLabelDiffers: 0,
    placeMismatch: 0,
    genericRelabeled: 0,
    ungeocoded: 0,
    shinjukuWasTakayama: 0,
    fujisawaWasKamakura: 0,
    areaRefined: 0,
    cityMismatch: 0,
    enoshimaNamedNowFujisawa: 0,
    enoshimaNamedWasKamakura: 0,
    enoshimaNamedWasTokyo: 0,
    enoshimaIsland: 0,
    enoshimaIslandNowFujisawa: 0,
    enoshimaIslandWasKamakura: 0,
    enoshimaIslandWasTokyo: 0,
    enoshimaNear: 0,
    bocchiSubjectIds: [...bocchiSubjectIds],
    bocchiSpots: 0,
    bocchiFujisawa: 0,
    bocchiFujisawaWasTokyo: 0,
    bocchiEnoshima: 0,
    bocchiEnoshimaWasTokyo: 0,
    bocchiEnoshimaNowFujisawa: 0,
    bocchiEnoshimaIsland: 0,
  };

  const enoshimaCenter = { lat: 35.2998, lng: 139.4806 };
  const onEnoshimaIsland = (lat, lng) =>
    lat >= 35.292 && lat <= 35.308 && lng >= 139.47 && lng <= 139.488;

  for (const spot of Object.values(spots)) {
    const oldLocation = spot.oldLocation;
    const generic = !oldLocation || oldLocation === "日本";
    if (!spot.areaCode) areaStats.ungeocoded += 1;
    if (oldLocation !== spot.location.zh) areaStats.zhLabelDiffers += 1;
    const matched = labelMatchesPlace(oldLocation, {
      zh: spot.location.zh,
      ja: spot.location.ja,
    });
    if (!generic && !matched) {
      areaStats.placeMismatch += 1;
      if (
        spot.location.zh.includes(oldLocation) ||
        spot.location.ja.includes(oldLocation) ||
        isPrefectureLabel(oldLocation)
      ) {
        areaStats.areaRefined += 1;
      } else {
        areaStats.cityMismatch += 1;
      }
    }
    if (generic && spot.areaCode) areaStats.genericRelabeled += 1;
    if (spot.areaCode === "13104" && oldLocation.includes("高山")) {
      areaStats.shinjukuWasTakayama += 1;
    }
    if (
      spot.areaCode === "14205" &&
      (oldLocation.includes("镰仓") || oldLocation.includes("鎌倉"))
    ) {
      areaStats.fujisawaWasKamakura += 1;
    }
    const named = spot.enoshimaNamed || ENO_PATTERN.test(oldLocation);
    const island = onEnoshimaIsland(spot.lat, spot.lng);
    const nearIsland = haversineMeters(enoshimaCenter, spot) <= 1_500;
    const wasKamakura =
      oldLocation.includes("镰仓") || oldLocation.includes("鎌倉");
    const wasTokyo =
      oldLocation.includes("东京") || oldLocation.includes("東京");
    if (island) {
      areaStats.enoshimaIsland += 1;
      if (spot.areaCode === "14205") areaStats.enoshimaIslandNowFujisawa += 1;
      if (wasKamakura) areaStats.enoshimaIslandWasKamakura += 1;
      if (wasTokyo) areaStats.enoshimaIslandWasTokyo += 1;
    }
    if (nearIsland) areaStats.enoshimaNear += 1;
    if (named && spot.areaCode === "14205") {
      areaStats.enoshimaNamedNowFujisawa += 1;
      if (wasKamakura) areaStats.enoshimaNamedWasKamakura += 1;
      if (wasTokyo) areaStats.enoshimaNamedWasTokyo += 1;
    }
    if (bocchiSubjectIds.has(spot.subjectId)) {
      areaStats.bocchiSpots += 1;
      if (spot.areaCode === "14205") {
        areaStats.bocchiFujisawa += 1;
        if (wasTokyo) areaStats.bocchiFujisawaWasTokyo += 1;
      }
      if (named) {
        areaStats.bocchiEnoshima += 1;
        if (wasTokyo) areaStats.bocchiEnoshimaWasTokyo += 1;
        if (spot.areaCode === "14205") areaStats.bocchiEnoshimaNowFujisawa += 1;
      }
      if (island) areaStats.bocchiEnoshimaIsland += 1;
    }

    if (!spot.redirectTo) {
      if (!locationMap.has(spot.locationSlug)) {
        locationMap.set(spot.locationSlug, {
          slug: spot.locationSlug,
          name: spot.location,
          spotCount: 0,
          subjectIds: new Set(),
        });
      }
      const location = locationMap.get(spot.locationSlug);
      location.spotCount += 1;
      location.subjectIds.add(spot.workSubjectId);
    }

    if (oldLocation) {
      if (!oldLabelTargets.has(oldLocation))
        oldLabelTargets.set(oldLocation, new Map());
      const targets = oldLabelTargets.get(oldLocation);
      targets.set(spot.locationSlug, (targets.get(spot.locationSlug) ?? 0) + 1);
    }
  }

  for (const work of animes) {
    const workSpots = (spotsByWork.get(work.subjectId) ?? []).filter(
      (spot) => !spot.redirectTo,
    );
    work.spotCount = workSpots.length;
    work.locationCount = new Set(
      workSpots.map((spot) => spot.locationSlug),
    ).size;
    delete work.members;
  }

  animes.sort(
    (a, b) =>
      b.spotCount - a.spotCount ||
      a.animeTitle.zh.localeCompare(b.animeTitle.zh, "zh"),
  );

  const locations = [...locationMap.values()]
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      spotCount: item.spotCount,
      animeCount: item.subjectIds.size,
    }))
    .sort(
      (a, b) =>
        b.spotCount - a.spotCount || a.name.zh.localeCompare(b.name.zh, "zh"),
    );
  const locationSlugs = new Set(locations.map((location) => location.slug));
  const places = loadMunicipalities(AREA_PATH).places;
  const placeBySlug = new Map(places.map((place) => [place.slug, place]));
  for (const location of locations) {
    location.isCoastal = municipalityTouchesSea(placeBySlug.get(location.slug));
  }

  /** @type {Record<string, string>} */
  const locationRedirects = {};
  for (const [oldLocation, targets] of oldLabelTargets) {
    let bestSlug = "";
    let bestCount = -1;
    for (const [slug, count] of targets) {
      if (count > bestCount) {
        bestSlug = slug;
        bestCount = count;
      }
    }
    const named = places.find(
      (place) =>
        locationSlugs.has(place.slug) && labelMatchesPlace(oldLocation, place),
    );
    const target = named?.slug || (locationSlugs.has(bestSlug) ? bestSlug : "");
    if (!target || target === oldLocation) continue;
    locationRedirects[oldLocation] = target;
  }

  let zhTwSpotCount = 0;
  /** @type {ReturnType<typeof reviewRow>[]} */
  const reviewRows = [];
  const animeTitleSources = { explicit: 0, override: 0, opencc: 0, ja: 0 };
  /** @type {Array<{ id: string, zh: string, tw: string }>} */
  const openccSamples = [];
  /** @type {Map<string, { text: string, source: string }>} */
  const animeTitleChoice = new Map();
  for (const anime of animes) {
    const chosen = zhTwAnimeTitle(
      anime.subjectIds?.length ? anime.subjectIds : anime.subjectId,
      anime.animeTitle,
    );
    anime.animeTitle.tw = chosen.text;
    anime.animeTitle.twSource = chosen.source;
    animeTitleChoice.set(anime.subjectId, chosen);
    animeTitleSources[chosen.source] = (animeTitleSources[chosen.source] ?? 0) + 1;
    const simplified = anime.animeTitle?.zh?.trim() ?? "";
    if (
      chosen.source === "opencc" &&
      openccSamples.length < 10 &&
      chosen.text !== simplified
    ) {
      openccSamples.push({
        id: anime.subjectId,
        zh: simplified,
        tw: chosen.text,
      });
    }
  }

  const attachTw = (record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    record.tw = toZhTw(record.zh ?? "");
  };
  const attachTwLines = (record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    record.tw = (record.zh ?? []).map((line) => toZhTw(line));
  };
  const remember = (kind, id, field, source, zh, zhTw) => {
    const left = zh ?? "";
    const right = zhTw ?? "";
    if (!left && !right) return;
    reviewRows.push(
      reviewRow({ kind, id, field, source, zh: left, zhTw: right }),
    );
  };
  const rememberField = (kind, id, field, record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    remember(kind, id, field, "opencc", record.zh ?? "", record.tw ?? "");
  };
  const rememberLines = (kind, id, field, record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    const zhLines = Array.isArray(record.zh) ? record.zh : [];
    const twLines = Array.isArray(record.tw) ? record.tw : [];
    const count = Math.max(zhLines.length, twLines.length);
    for (let index = 0; index < count; index += 1) {
      remember(
        kind,
        id,
        `${field}[${index}]`,
        "opencc",
        zhLines[index] ?? "",
        twLines[index] ?? "",
      );
    }
  };

  for (const spot of Object.values(spots)) {
    if (spot.redirectTo) continue;
    zhTwSpotCount += 1;
    attachTw(spot.title);
    attachTw(spot.description);
    attachTw(spot.location);
    attachTw(spot.answerName);
    if (spot.episodeContext && typeof spot.episodeContext === "object") {
      attachTw(spot.episodeContext);
    }
    attachTwLines(spot.funfact);
    const chosen =
      animeTitleChoice.get(spot.workSubjectId) ??
      zhTwAnimeTitle([spot.workSubjectId, spot.subjectId], spot.animeTitle);
    spot.animeTitle.tw = chosen.text;
    spot.animeTitle.twSource = chosen.source;
    rememberField("spot", spot.id, "title", spot.title);
    rememberField("spot", spot.id, "description", spot.description);
    rememberField("spot", spot.id, "answerName", spot.answerName);
    rememberField("spot", spot.id, "location", spot.location);
    rememberField("spot", spot.id, "episodeContext", spot.episodeContext);
    rememberLines("spot", spot.id, "funfact", spot.funfact);
    remember(
      "spot",
      spot.id,
      "animeTitle",
      chosen.source,
      spot.animeTitle?.zh ?? "",
      chosen.text,
    );
  }
  for (const anime of animes) {
    const chosen = animeTitleChoice.get(anime.subjectId);
    remember(
      "anime",
      anime.subjectId,
      "animeTitle",
      chosen?.source ?? "ja",
      anime.animeTitle?.zh ?? "",
      anime.animeTitle?.tw ?? "",
    );
  }
  for (const location of locations) {
    attachTw(location.name);
    rememberField("location", location.slug, "name", location.name);
  }
  reviewRows.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) ||
      String(a.id).localeCompare(String(b.id)) ||
      a.field.localeCompare(b.field),
  );
  const zhTwReview = {
    rows: reviewRows.length,
    flagged: reviewRows.filter((row) => row.flagged === "yes").length,
  };

  const spotIds = Object.keys(spots).sort();
  for (const spot of Object.values(spots)) {
    delete spot.oldLocation;
    delete spot.areaCode;
    delete spot.enoshimaNamed;
    delete spot.question;
  }

  const redirectMap = {
    animeBySubjectId: Object.fromEntries(
      animes.flatMap((anime) =>
        (anime.subjectIds ?? [anime.subjectId]).map((subjectId) => [
          subjectId,
          anime.slug,
        ]),
      ),
    ),
    locations: locationRedirects,
    spots: Object.fromEntries(
      Object.values(spots)
        .filter((spot) => spot.redirectTo && spot.redirectTo !== spot.id)
        .map((spot) => [spot.id, spot.redirectTo]),
    ),
  };
  await writeFile(
    path.join(process.cwd(), "src/lib/pilgrimage-redirect-map.json"),
    JSON.stringify(redirectMap),
  );

  const generatedAt = new Date().toISOString();
  const output = {
    generatedAt,
    sourceQuestionCount: questions.length,
    spotCount: visibleSpots.length,
    animeCount: animes.length,
    locationCount: locations.length,
    animes,
    locations,
    locationRedirects,
    zhTw: {
      coverage: "all-pilgrimage",
      locationCount: locations.length,
      spotCount: zhTwSpotCount,
      animeCount: animes.length,
      review: zhTwReview,
      animeTitles: {
        sources: animeTitleSources,
        openccSamples,
        curated: [
          "294993",
          "362577",
          "160209",
          "328609",
          "3128",
          "207195",
          "115908",
          "240038",
          "386809",
          "899",
        ].map((id) => {
          const anime = animes.find(
            (item) => item.subjectId === id || item.subjectIds?.includes(id),
          );
          if (!anime) return { id, missing: true };
          return {
            id,
            canonical: anime.subjectId,
            slug: anime.slug,
            source: animeTitleChoice.get(anime.subjectId)?.source ?? "",
            zh: anime.animeTitle?.zh ?? "",
            tw: anime.animeTitle?.tw ?? "",
            ja: anime.animeTitle?.ja ?? "",
          };
        }),
      },
    },
    spotIds,
    spots,
  };

  const pilgrimageSitemapPath = (route) =>
    route === "/" ||
    route === "/privacy" ||
    route === "/pilgrimage" ||
    route.startsWith("/pilgrimage/");
  const canonicalPaths = PUBLIC_ROUTES.map(([route, priority]) => ({
    path: route,
    priority,
    zhTw: pilgrimageSitemapPath(route),
  }));
  canonicalPaths.push(rightsSitemapItem());
  for (const anime of animes) {
    canonicalPaths.push({
      path: `/pilgrimage/anime/${anime.slug}`,
      priority: 0.75,
      zhTw: true,
    });
  }
  for (const location of locations) {
    canonicalPaths.push({
      path: `/pilgrimage/locations/${location.slug}`,
      priority: 0.7,
      zhTw: true,
    });
  }
  for (const spot of visibleSpots) {
    canonicalPaths.push({
      path: `/pilgrimage/spots/${encodeURIComponent(spot.id)}`,
      priority: 0.6,
      zhTw: true,
    });
  }

  const origin = resolveSiteOrigin();
  const lastModified = generatedAt.slice(0, 10);
  const sitemapChunks = chunkSitemapPaths(canonicalPaths);
  await mkdir(SITEMAP_DIR, { recursive: true });
  const sitemapUrls = [];
  for (let file = 0; file < sitemapChunks.length; file += 1) {
    const chunk = sitemapChunks[file];
    const entries = chunk.flatMap((item) =>
      buildLocalizedSitemapEntries(
        origin,
        item.path,
        item.priority,
        lastModified,
        { zhTw: Boolean(item.zhTw) },
      ),
    );
    const xml = buildUrlSetXml(entries);
    await writeFile(path.join(SITEMAP_DIR, `${file}.xml`), xml);
    sitemapUrls.push(`${origin}/sitemap/${file}.xml`);
  }
  await writeFile(
    path.join(SITEMAP_DIR, "index.xml"),
    buildSitemapIndexXml(sitemapUrls),
  );

  const buta = mergedGroups.find((group) =>
    group.subjects.some((subject) => subject.subjectId === "240038"),
  );

  const report = {
    generatedAt,
    sourceQuestionCount: questions.length,
    indexedSpots: spotIds.length,
    canonicalSpots: visibleSpots.length,
    translationGaps,
    areas: areaStats,
    anime: {
      subjectsBefore: subjects.length,
      pagesAfter: animes.length,
      mergedGroups: mergedGroups.length,
      redirectedSubjectPages: mergedGroups.reduce(
        (sum, group) => sum + group.subjects.length - 1,
        0,
      ),
      buta: buta ?? null,
      merged: mergedGroups,
    },
    duplicates: {
      tenMeterGroups,
      redirectedSpots,
      butaTenMeterGroups,
    },
    locations: locations.length,
    locationRedirects: Object.keys(locationRedirects).length,
    sitemap: {
      files: sitemapChunks.length,
      paths: canonicalPaths.length,
      urls: canonicalPaths.reduce(
        (sum, item) => sum + sitemapEntryCount(item),
        0,
      ),
    },
    zhTw: output.zhTw,
    redirects: {
      animeSubjects: Object.keys(redirectMap.animeBySubjectId).length,
      locations: Object.keys(redirectMap.locations).length,
      spots: Object.keys(redirectMap.spots).length,
    },
  };

  const nav = {
    version: 1,
    animes: Object.fromEntries(
      animes.map((anime) => [
        anime.subjectId,
        [
          anime.animeTitle?.zh ?? "",
          anime.animeTitle?.ja ?? "",
          anime.animeTitle?.en ?? "",
          anime.animeTitle?.tw ?? "",
        ],
      ]),
    ),
    spots: visibleSpots.map((spot) => [
      spot.id,
      spot.workSubjectId || spot.subjectId,
      spot.locationSlug,
      Math.round(spot.lat * 1e6) / 1e6,
      Math.round(spot.lng * 1e6) / 1e6,
      spot.answerName?.zh ?? "",
      spot.answerName?.ja ?? "",
      spot.answerName?.en ?? "",
      toZhTw(spot.answerName?.zh ?? ""),
    ]),
  };

  const homeMapLabels = buildHomeMapLabels({
    spots: visibleSpots.map((spot) => ({
      locationSlug: spot.locationSlug,
      lng: spot.lng,
      lat: spot.lat,
    })),
    locations: locations.map((location) => ({
      slug: location.slug,
      name: location.name,
    })),
    overrides: loadAreaNameOverrides(),
  });

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, "index.json"), JSON.stringify(output));
  await writeFile(NAV_PATH, JSON.stringify(nav));
  await writeFile(HOME_LABELS_PATH, JSON.stringify(homeMapLabels));
  await writeFile(
    path.join(OUTPUT_DIR, "zh-tw-review.csv"),
    reviewCsv(reviewRows),
  );
  await writeFile(
    path.join(OUTPUT_DIR, "build-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(
    JSON.stringify(
      {
        spots: report.canonicalSpots,
        animes: report.anime.pagesAfter,
        locations: report.locations,
        translationGaps: report.translationGaps,
        areas: report.areas,
        duplicates: report.duplicates,
        buta: report.anime.buta,
        sitemap: report.sitemap,
        zhTw: report.zhTw,
        mergedGroupCount: report.anime.mergedGroups,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
