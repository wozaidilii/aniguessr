/**
 * Generates en/ja location document metadata (top 30 areas by spot count,
 * with PostHog traffic slugs merged in) and refreshes intl-seo-step1-sitemap.json.
 *
 * Ranking: spot count from public/data/seo/index.json (primary). Slugs that
 * appeared in PostHog region pageviews (Oct 2026) are pinned into the set when
 * they are not already in the top 30 by count.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const INDEX_PATH = path.join(process.cwd(), "public/data/seo/index.json");
const META_PATH = path.join(
  process.cwd(),
  "scripts/data/location-meta-overrides.json",
);
const STEP1_PATH = path.join(
  process.cwd(),
  "scripts/data/intl-seo-step1-sitemap.json",
);

/** Region slugs with any PostHog $pageview in the last 30 days (Oct 2026 sample). */
const POSTHOG_TRAFFIC_SLUGS = [
  "shibuya-tokyo",
  "kumano-mie",
  "furano-hokkaido",
  "imizu-toyama",
  "kanazawa-ishikawa",
  "kamakura-kanagawa",
  "nishitokyo-tokyo",
  "chiyoda-tokyo",
  "wakayama-wakayama",
  "yonezawa-yamagata",
];

const TOP_N = 30;
const LASTMOD_ON = "2026-10-29";

/** Hand-polished en/ja document metadata for flagship regions. */
const MANUAL_LOCATION_META = {
  en: {
    "kamakura-kanagawa": {
      title:
        "Kamakura Anime Locations Map: Slam Dunk Crossing & More | AniGuessr",
      description:
        "Kamakura anime pilgrimage: Slam Dunk railroad crossing (Kamakura-Kōkōmae Station), Rascal Does Not Dream of Bunny Girl Senpai at Shichirigahama, and more with coordinates and Google Maps directions.",
    },
    "fujisawa-kanagawa": {
      title:
        "Enoshima Anime Locations Map: Rascal Does Not Dream & Bocchi the Rock | AniGuessr",
      description:
        "Enoshima (Fujisawa) anime pilgrimage: Rascal Does Not Dream of Bunny Girl Senpai and Bocchi the Rock! spots with coordinates and Google Maps directions.",
    },
  },
  ja: {
    "kamakura-kanagawa": {
      title:
        "鎌倉 アニメ聖地巡礼マップ｜スラムダンク踏切・青春ブタ野郎ほか | AniGuessr",
      description:
        "鎌倉のアニメ聖地巡礼：スラムダンクの踏切（鎌倉高校前駅）、青春ブタ野郎はバニーガール先輩の夢を見ないの七里ヶ浜ほか。座標と Google マップナビ付き。",
    },
    "fujisawa-kanagawa": {
      title:
        "江の島 アニメ聖地巡礼マップ｜青春ブタ野郎・ぼっち・ざ・ろっく！ | AniGuessr",
      description:
        "藤沢市・江の島のアニメ聖地巡礼：青春ブタ野郎はバニーガール先輩の夢を見ない、ぼっち・ざ・ろっく！ などの撮影地。座標と Google マップナビ付き。",
    },
  },
};

function pickLocalized(record, locale) {
  if (!record) return "";
  if (locale === "zh-tw") return record.tw ?? record.zh ?? record.ja ?? "";
  if (locale === "zh") return record.zh ?? record.ja ?? "";
  if (locale === "ja") return record.ja ?? record.zh ?? "";
  return record.en ?? record.ja ?? record.zh ?? "";
}

function topAnimeForLocation(spots, locationSlug, limit = 3) {
  const counts = new Map();
  for (const spot of spots) {
    if (spot.redirectTo || spot.locationSlug !== locationSlug) continue;
    const id = spot.subjectId;
    const title = pickLocalized(spot.animeTitle, "en");
    if (!title) continue;
    counts.set(id, { title, count: (counts.get(id)?.count ?? 0) + 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((row) => row.title);
}

function landmarkSpotName(spots, locationSlug, locale) {
  const candidates = spots
    .filter((spot) => !spot.redirectTo && spot.locationSlug === locationSlug)
    .map((spot) => ({
      name: pickLocalized(spot.answerName, locale) || pickLocalized(spot.title, locale),
      len: (pickLocalized(spot.answerName, locale) || pickLocalized(spot.title, locale))
        .length,
    }))
    .filter((row) => row.name.length > 0)
    .sort((a, b) => a.len - b.len || a.name.localeCompare(b.name));
  return candidates[0]?.name ?? "";
}

function enTitle(areaName, animeTitles, landmark) {
  const lead = animeTitles[0] ?? "Anime";
  const second = animeTitles[1];
  const bits = [];
  if (landmark && /crossing|踏切|平交道/i.test(landmark)) {
    bits.push(landmark.replace(/\s*\(.*/, ""));
  } else if (lead.toLowerCase().includes("slam dunk") || lead.includes("灌篮")) {
    bits.push("Slam Dunk Crossing");
  } else if (landmark) {
    bits.push(landmark.slice(0, 40));
  } else {
    bits.push(`${lead} locations`);
  }
  if (second && bits.length < 2) bits.push(second.split(" ")[0] ?? second);
  const tail = bits.slice(0, 2).join(" · ");
  return `${areaName} Anime Locations Map: ${tail} & More | AniGuessr`;
}

function enDescription(areaName, animeTitles, landmark) {
  const works = animeTitles.slice(0, 3).join(", ");
  const place = landmark ? `${landmark}, ` : "";
  return `${areaName} anime pilgrimage: ${place}${works}${works ? ", and more" : "mapped anime real-life locations"} with coordinates and Google Maps directions.`.replace(
    ", ,",
    ",",
  );
}

function jaTitle(areaName, animeTitles, landmark) {
  const works = animeTitles.slice(0, 2).join("・");
  const spot = landmark ? `（${landmark}ほか）` : "";
  return `${areaName} アニメ聖地巡礼マップ｜${works || "撮影地"}${spot} | AniGuessr`;
}

function jaDescription(areaName, animeTitles, landmark) {
  const works = animeTitles.slice(0, 3).join("、");
  const place = landmark ? `${landmark}、` : "";
  return `${areaName}のアニメ聖地巡礼：${place}${works} などの撮影地。座標と Google マップナビ付き。`;
}

function rankLocations(locations) {
  const byCount = [...locations]
    .filter((loc) => (loc.spotCount ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.spotCount ?? 0) - (a.spotCount ?? 0) ||
        a.slug.localeCompare(b.slug),
    );
  const picked = new Set();
  const ordered = [];
  for (const slug of POSTHOG_TRAFFIC_SLUGS) {
    const loc = byCount.find((row) => row.slug === slug);
    if (loc && !picked.has(slug)) {
      picked.add(slug);
      ordered.push(loc);
    }
  }
  for (const loc of byCount) {
    if (picked.size >= TOP_N) break;
    if (picked.has(loc.slug)) continue;
    picked.add(loc.slug);
    ordered.push(loc);
  }
  return ordered.slice(0, TOP_N);
}

function main() {
  const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  const spots = Object.values(index.spots ?? {});
  const ranked = rankLocations(index.locations ?? []);
  const meta = JSON.parse(readFileSync(META_PATH, "utf8"));
  meta.en ??= {};
  meta.ja ??= {};

  for (const location of ranked) {
    const areaEn = pickLocalized(location.name, "en");
    const areaJa = pickLocalized(location.name, "ja");
    const animeEn = topAnimeForLocation(spots, location.slug, 3);
    const animeJa = topAnimeForLocation(spots, location.slug, 3).map((title) =>
      pickLocalized(
        spots.find(
          (spot) =>
            spot.locationSlug === location.slug &&
            pickLocalized(spot.animeTitle, "en") === title,
        )?.animeTitle,
        "ja",
      ),
    );
    const landmarkEn = landmarkSpotName(spots, location.slug, "en");
    const landmarkJa = landmarkSpotName(spots, location.slug, "ja");
    meta.en[location.slug] = {
      title: enTitle(areaEn, animeEn, landmarkEn),
      description: enDescription(areaEn, animeEn, landmarkEn),
    };
    meta.ja[location.slug] = {
      title: jaTitle(areaJa, animeJa.filter(Boolean), landmarkJa),
      description: jaDescription(areaJa, animeJa.filter(Boolean), landmarkJa),
    };
  }

  for (const locale of ["en", "ja"]) {
    for (const [slug, entry] of Object.entries(MANUAL_LOCATION_META[locale])) {
      meta[locale][slug] = entry;
    }
  }

  writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  writeFileSync(
    STEP1_PATH,
    `${JSON.stringify(
      {
        lastmodOn: LASTMOD_ON,
        locationMetaSlugs: ranked.map((row) => row.slug),
        zhTwRenamedSpotIds: Object.keys(
          JSON.parse(
            readFileSync(
              path.join(
                process.cwd(),
                "scripts/data/zh-tw-spot-place-overrides.json",
              ),
              "utf8",
            ),
          ),
        ),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `Updated ${ranked.length} location meta overrides (en/ja). Slugs:`,
    ranked.map((row) => row.slug).join(", "),
  );
}

main();
