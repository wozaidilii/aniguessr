import { createHash } from "node:crypto";

import {
  HOME_OG_COPY,
  OG_TEMPLATE_VERSION,
  ogCopy,
  ogLocaleChain,
  type OgLocale,
} from "~/lib/og/copy";
import { japanesePlaceLabel } from "~/lib/localized-text";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  layoutAreaMarkers,
  layoutSpotMarkers,
  layoutWorkMarkers,
  type LatLng,
  type MapArt,
  type MarkerLayout,
} from "~/lib/og/map";
import {
  COL_W,
  SAFETY,
  ellipsize,
  fitChip,
  fitField,
  splitKeptSuffix,
  titleLineHeight,
  units,
} from "~/lib/og/text";

export interface OgNames {
  ja: string;
  zh: string;
  "zh-tw": string;
  en: string;
}

export interface OgStatPart {
  text: string;
  strong: boolean;
}

export interface OgSubtitleLine {
  body: string;
  suffix: string;
}

export interface OgCard {
  kind: "spot" | "work" | "area" | "home";
  requestedLocale: PilgrimageLocale;
  contentLocale: OgLocale;
  art: MapArt;
  chip: string;
  titleSize: number;
  titleLineHeight: number;
  titleLines: string[];
  subtitleSize: number;
  subtitleLines: OgSubtitleLine[];
  stat: OgStatPart[];
  pills: string[];
  markers: MarkerLayout;
  alt: string;
  version: string;
}

export function emptyNames(): OgNames {
  return { ja: "", zh: "", "zh-tw": "", en: "" };
}

export function readOgName(
  names: OgNames | undefined,
  locale: OgLocale,
): string {
  return names?.[locale]?.trim() ?? "";
}

/** Optional og_title / short_name win, then the canonical name, in one locale. */
export function preferredName(
  locale: OgLocale,
  base: OgNames | undefined,
  ogTitle?: OgNames,
  shortName?: OgNames,
): string {
  return (
    readOgName(ogTitle, locale) ||
    readOgName(shortName, locale) ||
    readOgName(base, locale)
  );
}

/**
 * Order used only when the resolved card locale itself has no string.
 * Japanese place names do not use this list; they use `displaySpotPlace`.
 */
const HOLE_ORDER: Record<OgLocale, readonly OgLocale[]> = {
  ja: ["en", "zh", "zh-tw"],
  zh: ["ja", "en", "zh-tw"],
  en: ["ja", "zh", "zh-tw"],
  "zh-tw": ["zh", "ja", "en"],
};

export function displayName(
  locale: OgLocale,
  base: OgNames | undefined,
  ogTitle?: OgNames,
  shortName?: OgNames,
): string {
  const direct = preferredName(locale, base, ogTitle, shortName);
  if (direct) return direct;
  for (const next of HOLE_ORDER[locale]) {
    const value = preferredName(next, base, ogTitle, shortName);
    if (value) return value;
  }
  return "";
}

/**
 * Japanese place labels stay on the Japanese card. A CJK-only zh name or
 * the Japanese scene title wins over romaji. Other locales keep `displayName`.
 */
export function displaySpotPlace(
  locale: OgLocale,
  base: OgNames | undefined,
  ogTitle?: OgNames,
  shortName?: OgNames,
  derivedJa?: string,
  titleZh?: string,
): string {
  if (locale !== "ja") return displayName(locale, base, ogTitle, shortName);
  return japanesePlaceLabel({
    ja: preferredName("ja", base, ogTitle, shortName),
    zh: preferredName("zh", base, ogTitle, shortName),
    en: preferredName("en", base, ogTitle, shortName),
    tw: preferredName("zh-tw", base, ogTitle, shortName),
    titleJa: derivedJa,
    titleZh,
  });
}

export function resolveContentLocale(
  requested: PilgrimageLocale,
  required: Array<(locale: OgLocale) => string>,
): OgLocale {
  const chain = ogLocaleChain(requested);
  for (const locale of chain) {
    if (required.every((read) => read(locale).trim())) return locale;
  }
  return chain[chain.length - 1] ?? "ja";
}

function usable(names: OgNames): boolean {
  return (
    ogLocaleChain("zh-tw").some((locale) => readOgName(names, locale)) ||
    Boolean(readOgName(names, "en"))
  );
}

function versionFor(parts: readonly string[]): string {
  const hash = createHash("sha256")
    .update(OG_TEMPLATE_VERSION)
    .update("\0")
    .update(parts.join("\0"))
    .digest("base64url")
    .slice(0, 12);
  return `${OG_TEMPLATE_VERSION}.${hash}`;
}

function markerKey(layout: MarkerLayout): string {
  const point = (item: { x: number; y: number }) => `${item.x},${item.y}`;
  return [
    layout.art,
    layout.activePin ? point(layout.activePin) : "",
    layout.pins.map(point).join(";"),
    layout.minorPins.map(point).join(";"),
    layout.clusters.map((item) => `${item.x},${item.y},${item.n}`).join(";"),
  ].join("|");
}

function titleBlock(
  text: string,
  locale: OgLocale,
  field: "spotTitle" | "workTitle" | "areaTitle",
) {
  const fit = fitField(text, locale, field);
  return {
    titleSize: fit.size,
    titleLineHeight: titleLineHeight(locale),
    titleLines: fit.lines,
  };
}

function subtitleBlock(text: string, locale: OgLocale, keep?: string) {
  const fit = fitField(text, locale, "sub", keep);
  return {
    subtitleSize: fit.size,
    subtitleLines: fit.lines.map((line) => splitKeptSuffix(line, keep)),
  };
}

export function buildSpotCard(input: {
  requestedLocale: PilgrimageLocale;
  spotName: OgNames;
  ogTitle?: OgNames;
  shortName?: OgNames;
  workTitle: OgNames;
  workOgTitle?: OgNames;
  workShortName?: OgNames;
  areaName: OgNames;
  areaOgTitle?: OgNames;
  areaShortName?: OgNames;
  otherWorkCount: number;
  art: MapArt;
  origin: LatLng;
  nearby: LatLng[];
  /** Japanese label from the spot scene title, used when answerName.ja is blank. */
  derivedJa?: string;
  /** Simplified scene title, used when the Japanese title is also blank or Latin. */
  titleZh?: string;
}): OgCard {
  const workName = (locale: OgLocale) =>
    preferredName(
      locale,
      input.workTitle,
      input.workOgTitle,
      input.workShortName,
    );
  const areaName = (locale: OgLocale) =>
    preferredName(
      locale,
      input.areaName,
      input.areaOgTitle,
      input.areaShortName,
    );
  const contentLocale = resolveContentLocale(input.requestedLocale, [
    (locale) =>
      preferredName(locale, input.spotName, input.ogTitle, input.shortName),
    workName,
    areaName,
  ]);
  const copy = ogCopy(contentLocale);
  const spot = displaySpotPlace(
    contentLocale,
    input.spotName,
    input.ogTitle,
    input.shortName,
    input.derivedJa,
    input.titleZh,
  );
  const work = displayName(
    contentLocale,
    input.workTitle,
    input.workOgTitle,
    input.workShortName,
  );
  const areaCap = ((COL_W - 40) * SAFETY) / 28;
  const areaRaw = displayName(
    contentLocale,
    input.areaName,
    input.areaOgTitle,
    input.areaShortName,
  );
  const area =
    units(areaRaw) <= areaCap
      ? areaRaw
      : ellipsize(areaRaw, areaCap, contentLocale);
  const more =
    input.otherWorkCount > 0 ? copy.moreWorks(input.otherWorkCount) : undefined;
  const markers = layoutSpotMarkers(input.origin, input.nearby, input.art);
  const title = titleBlock(spot, contentLocale, "spotTitle");
  const subtitle = subtitleBlock(work, contentLocale, more);
  return {
    kind: "spot",
    requestedLocale: input.requestedLocale,
    contentLocale,
    art: input.art,
    chip: copy.chipSpot,
    ...title,
    ...subtitle,
    stat: [{ text: area, strong: false }],
    pills: [],
    markers,
    alt: copy.altSpot(spot, work),
    version: versionFor([
      "spot",
      input.requestedLocale,
      contentLocale,
      spot,
      work,
      more ?? "",
      area,
      markerKey(markers),
    ]),
  };
}

export function buildWorkCard(input: {
  requestedLocale: PilgrimageLocale;
  title: OgNames;
  ogTitle?: OgNames;
  shortName?: OgNames;
  spotCount: number;
  areas: OgNames[];
  points: LatLng[];
  art: MapArt;
}): OgCard {
  const areas = input.areas.filter(usable).slice(0, 3);
  const contentLocale = resolveContentLocale(input.requestedLocale, [
    (locale) =>
      preferredName(locale, input.title, input.ogTitle, input.shortName),
  ]);
  const copy = ogCopy(contentLocale);
  const title = displayName(
    contentLocale,
    input.title,
    input.ogTitle,
    input.shortName,
  );
  const count = copy.spotCount(input.spotCount);
  const markers = layoutWorkMarkers(input.points, input.art);
  const fitted = titleBlock(title, contentLocale, "workTitle");
  const pills = areas
    .map((area) => fitChip(readOgName(area, contentLocale)))
    .filter(Boolean);
  return {
    kind: "work",
    requestedLocale: input.requestedLocale,
    contentLocale,
    art: input.art,
    chip: copy.chipWork,
    ...fitted,
    subtitleSize: 0,
    subtitleLines: [],
    stat: [
      { text: count.strong, strong: true },
      { text: count.rest, strong: false },
    ],
    pills,
    markers,
    alt: copy.altWork(title, input.spotCount),
    version: versionFor([
      "work",
      input.requestedLocale,
      contentLocale,
      title,
      String(input.spotCount),
      pills.join("|"),
      markerKey(markers),
    ]),
  };
}

export function buildAreaCard(input: {
  requestedLocale: PilgrimageLocale;
  title: OgNames;
  ogTitle?: OgNames;
  shortName?: OgNames;
  workCount: number;
  spotCount: number;
  works: OgNames[];
  points: LatLng[];
  art: MapArt;
}): OgCard {
  const works = input.works.filter(usable).slice(0, 3);
  const contentLocale = resolveContentLocale(input.requestedLocale, [
    (locale) =>
      preferredName(locale, input.title, input.ogTitle, input.shortName),
  ]);
  const copy = ogCopy(contentLocale);
  const title = displayName(
    contentLocale,
    input.title,
    input.ogTitle,
    input.shortName,
  );
  const stat = copy.areaStat(input.workCount, input.spotCount);
  const markers = layoutAreaMarkers(input.points, input.art);
  const fitted = titleBlock(title, contentLocale, "areaTitle");
  const pills = works
    .map((work) => fitChip(readOgName(work, contentLocale)))
    .filter(Boolean);
  return {
    kind: "area",
    requestedLocale: input.requestedLocale,
    contentLocale,
    art: input.art,
    chip: copy.chipArea,
    ...fitted,
    subtitleSize: 0,
    subtitleLines: [],
    stat: [
      { text: stat.works, strong: true },
      { text: stat.between, strong: false },
      { text: stat.spots, strong: true },
      { text: stat.after, strong: false },
    ],
    pills,
    markers,
    alt: copy.altArea(title),
    version: versionFor([
      "area",
      input.requestedLocale,
      contentLocale,
      title,
      String(input.workCount),
      String(input.spotCount),
      pills.join("|"),
      markerKey(markers),
    ]),
  };
}

const HOME_POINTS: LatLng[] = [
  { lat: 35.2998, lng: 139.4806 },
  { lat: 35.3192, lng: 139.5503 },
  { lat: 35.4437, lng: 139.638 },
  { lat: 35.6595, lng: 139.7004 },
  { lat: 35.6812, lng: 139.7671 },
];

/** Map + text homepage card. No screenshots. Each locale stays in one language. */
export function buildHomeCard(input: {
  requestedLocale: PilgrimageLocale;
  spotCount: number;
  points?: LatLng[];
}): OgCard {
  const contentLocale: OgLocale =
    input.requestedLocale === "zh" ||
    input.requestedLocale === "zh-tw" ||
    input.requestedLocale === "en"
      ? input.requestedLocale
      : "ja";
  const copy = HOME_OG_COPY[contentLocale];
  const count = ogCopy(contentLocale).spotCount(input.spotCount);
  const points =
    input.points && input.points.length > 0 ? input.points : HOME_POINTS;
  const markers = layoutAreaMarkers(points, "coast");
  const fitted = titleBlock(copy.title, contentLocale, "workTitle");
  return {
    kind: "home",
    requestedLocale: input.requestedLocale,
    contentLocale,
    art: "coast",
    chip: fitChip(copy.chip),
    ...fitted,
    subtitleSize: 0,
    subtitleLines: [],
    stat: [
      { text: count.strong, strong: true },
      { text: count.rest, strong: false },
    ],
    pills: [],
    markers,
    alt: copy.alt,
    version: versionFor([
      "home",
      input.requestedLocale,
      contentLocale,
      copy.title,
      String(input.spotCount),
      markerKey(markers),
    ]),
  };
}
