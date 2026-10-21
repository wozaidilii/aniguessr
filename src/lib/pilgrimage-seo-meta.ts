import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { BRAND_NAME } from "~/lib/site-url";

/**
 * Metadata-only title and description patterns.
 * Marketing can rewrite the wording here without touching visible page copy.
 *
 * Placeholders: {brand} {anime} {place} {area} {episode} {scene} {id}
 * {count} {spotCount} {animeCount} {locationCount}
 *
 * Spot titles use the SEO desk pattern and end with `AniGuessr`.
 * The area parentheses are omitted when the place already names one,
 * or when the title would pass the locale character limit.
 */
export const PILGRIMAGE_SEO_TEMPLATES: Record<
  PilgrimageLocale,
  {
    spotTitle: string;
    spotTitleWithEpisode: string;
    spotTitleWithScene: string;
    spotTitleWithId: string;
    spotDescription: string;
    spotDescriptionWithEpisode: string;
    spotDescriptionWithScene: string;
    spotDescriptionWithId: string;
    animeTitle: string;
    animeTitleWithId: string;
    animeDescription: string;
    animeDescriptionWithId: string;
    locationTitle: string;
    locationDescription: string;
    hubTitle: string;
    hubDescription: string;
    animeIndexTitle: string;
    animeIndexDescription: string;
    locationIndexTitle: string;
    locationIndexDescription: string;
  }
> = {
  en: {
    spotTitle: "{place} — {anime} Real-Life Location | AniGuessr",
    spotTitleWithEpisode: "{place} — {anime} Real-Life Location | AniGuessr",
    spotTitleWithScene: "{place} — {anime} Real-Life Location | AniGuessr",
    spotTitleWithId: "{place} — {anime} Real-Life Location | AniGuessr",
    spotDescription:
      "{place} appears in {anime}, in {area}. Preview it on Street View and get directions in Google Maps.",
    spotDescriptionWithEpisode:
      "{place} appears in {anime}, {episode}, in {area}. Preview it on Street View and get directions in Google Maps.",
    spotDescriptionWithScene:
      "{place} appears in {anime}. Nearest station: {station}. Preview it on Street View and get directions in Google Maps.",
    spotDescriptionWithId:
      "{place} appears in {anime}, {episode}. Nearest station: {station}. Preview it on Street View and get directions in Google Maps.",
    animeTitle: "{anime} Real-Life Locations | {brand}",
    animeTitleWithId: "{anime} ({id}) Real-Life Locations | {brand}",
    animeDescription:
      "{count} real-life locations for {anime}, with coordinates and scene notes.",
    animeDescriptionWithId:
      "{count} real-life locations for {anime} ({id}), with coordinates and scene notes.",
    locationTitle: "{area} anime real-life locations | {brand}",
    locationDescription: "{count} anime real-life locations in {area}.",
    hubTitle: "Anime real-life locations | {brand}",
    hubDescription:
      "Browse {spotCount} anime real-life locations from {animeCount} series across {locationCount} regions.",
    animeIndexTitle: "Anime pilgrimage index | {brand}",
    animeIndexDescription:
      "{animeCount} anime series with mapped real-life locations.",
    locationIndexTitle: "Anime real-life locations by region | {brand}",
    locationIndexDescription:
      "{locationCount} regions with mapped anime real-life locations.",
  },
  ja: {
    spotTitle: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithEpisode: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithScene: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithId: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotDescription:
      "『{anime}』に登場する{place}。{area}。ストリートビューで下見して、Googleマップでナビできます。",
    spotDescriptionWithEpisode:
      "『{anime}』{episode}に登場する{place}。{area}。ストリートビューで下見して、Googleマップでナビできます。",
    spotDescriptionWithScene:
      "『{anime}』に登場する{place}。最寄りは{station}。ストリートビューで下見して、Googleマップでナビできます。",
    spotDescriptionWithId:
      "『{anime}』{episode}に登場する{place}。最寄りは{station}。ストリートビューで下見して、Googleマップでナビできます。",
    animeTitle: "{anime} 撮影地一覧 | {brand}",
    animeTitleWithId: "{anime}（{id}）撮影地一覧 | {brand}",
    animeDescription: "{anime}の実在撮影地 {count} 件。座標とシーン情報つき。",
    animeDescriptionWithId:
      "{anime}（{id}）の実在撮影地 {count} 件。座標とシーン情報つき。",
    locationTitle: "{area}のアニメ撮影地 | {brand}",
    locationDescription: "{area}のアニメ撮影地 {count} 件。",
    hubTitle: "アニメ撮影地・聖地巡礼 | {brand}",
    hubDescription:
      "{animeCount} 作品・{locationCount} 地域・撮影地 {spotCount} 件の聖地巡礼ガイド。",
    animeIndexTitle: "作品別アニメ撮影地 | {brand}",
    animeIndexDescription: "撮影地を収録したアニメ作品 {animeCount} 本。",
    locationIndexTitle: "地域別アニメ撮影地 | {brand}",
    locationIndexDescription: "アニメ撮影地がある地域 {locationCount} 件。",
  },
  zh: {
    spotTitle: "{anime} 圣地：{place}（{area}）| AniGuessr",
    spotTitleWithEpisode: "{anime} 圣地：{place}（{area}）| AniGuessr",
    spotTitleWithScene: "{anime} 圣地：{place}（{area}）| AniGuessr",
    spotTitleWithId: "{anime} 圣地：{place}（{area}）| AniGuessr",
    spotDescription:
      "《{anime}》取景地「{place}」，位于{area}。可以在街景里预览，并用 Google 地图导航。",
    spotDescriptionWithEpisode:
      "《{anime}》{episode}取景地「{place}」，位于{area}。可以在街景里预览，并用 Google 地图导航。",
    spotDescriptionWithScene:
      "《{anime}》取景地「{place}」。最近车站是{station}。可以在街景里预览，并用 Google 地图导航。",
    spotDescriptionWithId:
      "《{anime}》{episode}取景地「{place}」。最近车站是{station}。可以在街景里预览，并用 Google 地图导航。",
    animeTitle: "{anime} 取景地 | {brand}",
    animeTitleWithId: "{anime}（{id}）取景地 | {brand}",
    animeDescription: "{anime} 的现实取景地共 {count} 处，含坐标与场景信息。",
    animeDescriptionWithId:
      "{anime}（{id}）的现实取景地共 {count} 处，含坐标与场景信息。",
    locationTitle: "{area} 动漫取景地 | {brand}",
    locationDescription: "{area} 的动漫取景地共 {count} 处。",
    hubTitle: "动漫取景地与圣地巡礼 | {brand}",
    hubDescription:
      "收录 {animeCount} 部作品、{locationCount} 个地区、共 {spotCount} 处动漫取景地。",
    animeIndexTitle: "按作品浏览动漫取景地 | {brand}",
    animeIndexDescription: "已收录取景地的动漫作品共 {animeCount} 部。",
    locationIndexTitle: "按地区浏览动漫取景地 | {brand}",
    locationIndexDescription: "已收录动漫取景地的地区共 {locationCount} 个。",
  },
  // Traditional wording of the zh templates. 動漫 stays 動畫, matching
  // the visible zh-TW copy. Place and work names come from the zh-TW resolver.
  "zh-tw": {
    spotTitle: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithEpisode: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithScene: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotTitleWithId: "{anime} 聖地：{place}（{area}）| AniGuessr",
    spotDescription:
      "《{anime}》取景地「{place}」，位於{area}。可以在街景裡預覽，並用 Google 地圖導航。",
    spotDescriptionWithEpisode:
      "《{anime}》{episode}取景地「{place}」，位於{area}。可以在街景裡預覽，並用 Google 地圖導航。",
    spotDescriptionWithScene:
      "《{anime}》取景地「{place}」。最近車站是{station}。可以在街景裡預覽，並用 Google 地圖導航。",
    spotDescriptionWithId:
      "《{anime}》{episode}取景地「{place}」。最近車站是{station}。可以在街景裡預覽，並用 Google 地圖導航。",
    animeTitle: "{anime} 取景地 | {brand}",
    animeTitleWithId: "{anime}（{id}）取景地 | {brand}",
    animeDescription: "{anime} 的現實取景地共 {count} 處，含座標與場景資訊。",
    animeDescriptionWithId:
      "{anime}（{id}）的現實取景地共 {count} 處，含座標與場景資訊。",
    locationTitle: "{area} 動畫取景地 | {brand}",
    locationDescription: "{area} 的動畫取景地共 {count} 處。",
    hubTitle: "動畫取景地與聖地巡禮 | {brand}",
    hubDescription:
      "收錄 {animeCount} 部作品、{locationCount} 個地區、共 {spotCount} 處動畫取景地。",
    animeIndexTitle: "按作品瀏覽動畫取景地 | {brand}",
    animeIndexDescription: "已收錄取景地的動畫作品共 {animeCount} 部。",
    locationIndexTitle: "按地區瀏覽動畫取景地 | {brand}",
    locationIndexDescription: "已收錄動畫取景地的地區共 {locationCount} 個。",
  },
};

export type SpotSeoVariant = "base" | "episode" | "scene" | "id";

export interface SpotSeoFields {
  id: string;
  anime: string;
  place: string;
  area: string;
  episode: string;
  scene: string;
  /** Set only from a real station field. Never inferred from the place name. */
  station?: string;
}

/** ja / zh / zh-tw titles stay near 120 characters. English stays near 155. */
export const SPOT_SEO_CHAR_LIMIT: Record<PilgrimageLocale, number> = {
  ja: 120,
  zh: 120,
  "zh-tw": 120,
  en: 155,
};

const EPISODE_NUMBER = /第\s*(\d+)\s*([話话集])/;
const ENGLISH_EPISODE = /^episode\s+(\d+)\b/i;
const NOT_A_SINGLE_EPISODE =
  /不明|未知|不詳|unknown|複数|多集|多次|multiple|several/i;

export function codePointLength(value: string): number {
  return [...value].length;
}

/**
 * A single episode number, without timestamps or scene notes.
 * "Unknown", "multiple episodes", and unstructured text stay empty.
 */
export function spotEpisodeLabel(
  locale: PilgrimageLocale,
  raw: string,
): string {
  const text = raw.trim();
  if (!text || NOT_A_SINGLE_EPISODE.test(text)) return "";
  if (locale === "en") {
    const match = ENGLISH_EPISODE.exec(text);
    return match ? `Episode ${match[1]}` : "";
  }
  const match = EPISODE_NUMBER.exec(text);
  if (!match) return "";
  const unit = locale === "ja" ? "話" : "集";
  return `第${match[1]}${unit}`;
}

export interface RenderedSeo {
  title: string;
  description: string;
}

export function fillSeoTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = vars[key];
      return value === null || value === undefined ? "" : String(value);
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/**
 * Pick the lightest title variant that keeps each spot's title unique
 * within one locale. Most spots stay on the base filming-location pattern.
 */
export function assignSpotSeoVariants(
  spots: SpotSeoFields[],
): Map<string, SpotSeoVariant> {
  const assigned = new Map<string, SpotSeoVariant>();
  const byPlace = groupBy(spots, (spot) => `${spot.anime}\0${spot.place}`);

  for (const group of byPlace.values()) {
    if (group.length === 1) {
      assigned.set(group[0]!.id, "base");
      continue;
    }

    const byEpisode = groupBy(group, (spot) => spot.episode.trim());
    for (const [episode, members] of byEpisode) {
      if (members.length === 1 && episode) {
        assigned.set(members[0]!.id, "episode");
        continue;
      }

      const byScene = groupBy(members, (spot) => spot.scene.trim());
      for (const sceneMembers of byScene.values()) {
        const scene = sceneMembers[0]?.scene.trim() ?? "";
        const sceneIsUseful =
          scene.length > 0 && scene !== (sceneMembers[0]?.place ?? "");
        if (sceneMembers.length === 1 && sceneIsUseful) {
          assigned.set(sceneMembers[0]!.id, "scene");
          continue;
        }
        for (const spot of sceneMembers) assigned.set(spot.id, "id");
      }
    }
  }

  return assigned;
}

function titleMark(
  locale: PilgrimageLocale,
  fields: SpotSeoFields,
  variant: SpotSeoVariant,
  episode: string,
): string {
  if (variant === "episode") return episode || fields.episode.trim();
  if (variant === "scene") return fields.scene.trim();
  if (variant === "id") return fields.id.trim();
  return "";
}

function areaAlreadyNamed(place: string): boolean {
  return place.includes("（") || place.includes("(");
}

function composeSpotTitle(
  locale: PilgrimageLocale,
  anime: string,
  place: string,
  area: string,
): string {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  if (locale === "en") {
    return fillSeoTemplate(templates.spotTitle, { anime, place });
  }
  const region = area.trim();
  const withArea = region.length > 0 && !areaAlreadyNamed(place);
  const template = withArea
    ? templates.spotTitle
    : templates.spotTitle.replace("（{area}）", "");
  return fillSeoTemplate(template, { anime, place, area: region });
}

function fitSpotTitle(
  locale: PilgrimageLocale,
  anime: string,
  place: string,
  area: string,
): string {
  const limit = SPOT_SEO_CHAR_LIMIT[locale];
  const withArea = composeSpotTitle(locale, anime, place, area);
  if (codePointLength(withArea) <= limit) return withArea;
  const bare = composeSpotTitle(locale, anime, place, "");
  if (codePointLength(bare) <= limit) return bare;

  const animeChars = [...anime];
  const placeChars = [...place];
  const render = () =>
    composeSpotTitle(locale, animeChars.join(""), placeChars.join(""), "");
  while (
    codePointLength(render()) > limit &&
    (animeChars.length > 1 || placeChars.length > 1)
  ) {
    if (placeChars.length >= animeChars.length && placeChars.length > 1) {
      placeChars.pop();
    } else if (animeChars.length > 1) animeChars.pop();
    else placeChars.pop();
  }
  if (animeChars.join("") !== anime && animeChars.length > 0) {
    animeChars[animeChars.length - 1] = "…";
  }
  if (placeChars.join("") !== place && placeChars.length > 0) {
    placeChars[placeChars.length - 1] = "…";
  }
  let title = render();
  while (codePointLength(title) > limit && placeChars.length > 1) {
    placeChars.pop();
    if (placeChars.length > 0) placeChars[placeChars.length - 1] = "…";
    title = render();
  }
  return title;
}

/** `scene` / `id` slots hold the station templates. Title variants stay separate. */
function descriptionKey(
  episode: string,
  station: string,
): "base" | "episode" | "scene" | "id" {
  if (episode && station) return "id";
  if (station) return "scene";
  if (episode) return "episode";
  return "base";
}

function composeSpotDescription(
  locale: PilgrimageLocale,
  anime: string,
  place: string,
  area: string,
  episode: string,
  station: string,
): string {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const key = descriptionKey(episode, station);
  let template = {
    base: templates.spotDescription,
    episode: templates.spotDescriptionWithEpisode,
    scene: templates.spotDescriptionWithScene,
    id: templates.spotDescriptionWithId,
  }[key];
  if (!station && !area.trim()) {
    template = template
      .replace("{area}。", "")
      .replace("，位于{area}。", "。")
      .replace("，位於{area}。", "。")
      .replace(", in {area}", "");
  }
  return fillSeoTemplate(template, {
    anime,
    place,
    area,
    episode,
    station,
  });
}

const STREET_VIEW_SENTENCE: Record<PilgrimageLocale, string> = {
  ja: "ストリートビューで下見して、Googleマップでナビできます。",
  zh: "可以在街景里预览，并用 Google 地图导航。",
  "zh-tw": "可以在街景裡預覽，並用 Google 地圖導航。",
  en: "Preview it on Street View and get directions in Google Maps.",
};

function withoutStreetView(locale: PilgrimageLocale, text: string): string {
  return text
    .replace(STREET_VIEW_SENTENCE[locale], "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fitSpotDescription(
  locale: PilgrimageLocale,
  anime: string,
  place: string,
  area: string,
  episode: string,
  station: string,
): string {
  const limit = SPOT_SEO_CHAR_LIMIT[locale];
  const full = composeSpotDescription(
    locale,
    anime,
    place,
    area,
    episode,
    station,
  );
  if (codePointLength(full) <= limit) return full;

  const withoutArea = station
    ? full
    : composeSpotDescription(locale, anime, place, "", episode, "");
  if (codePointLength(withoutArea) <= limit) return withoutArea;

  return withoutStreetView(locale, withoutArea);
}

export function buildSpotSeo(
  locale: PilgrimageLocale,
  fields: SpotSeoFields,
  variant: SpotSeoVariant,
): RenderedSeo {
  const episode = spotEpisodeLabel(locale, fields.episode);
  const station = fields.station?.trim() ?? "";
  const mark = titleMark(locale, fields, variant, episode);
  const place = mark ? `${fields.place}・${mark}` : fields.place;
  return {
    title: fitSpotTitle(locale, fields.anime.trim(), place.trim(), fields.area),
    description: fitSpotDescription(
      locale,
      fields.anime.trim(),
      fields.place.trim(),
      fields.area.trim(),
      episode,
      station,
    ),
  };
}

export function buildAnimePageSeo(
  locale: PilgrimageLocale,
  anime: { id: string; title: string; count: number },
  ambiguous: boolean,
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = {
    brand: BRAND_NAME,
    anime: anime.title,
    id: anime.id,
    count: anime.count,
  };
  return {
    title: fillSeoTemplate(
      ambiguous ? templates.animeTitleWithId : templates.animeTitle,
      vars,
    ),
    description: fillSeoTemplate(
      ambiguous ? templates.animeDescriptionWithId : templates.animeDescription,
      vars,
    ),
  };
}

export function buildLocationPageSeo(
  locale: PilgrimageLocale,
  location: { name: string; count: number },
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = {
    brand: BRAND_NAME,
    area: location.name,
    count: location.count,
  };
  return {
    title: fillSeoTemplate(templates.locationTitle, vars),
    description: fillSeoTemplate(templates.locationDescription, vars),
  };
}

export function buildPilgrimageHubSeo(
  locale: PilgrimageLocale,
  counts: { spotCount: number; animeCount: number; locationCount: number },
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = { brand: BRAND_NAME, ...counts };
  return {
    title: fillSeoTemplate(templates.hubTitle, vars),
    description: fillSeoTemplate(templates.hubDescription, vars),
  };
}

export function buildAnimeIndexSeo(
  locale: PilgrimageLocale,
  counts: { animeCount: number },
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = { brand: BRAND_NAME, ...counts };
  return {
    title: fillSeoTemplate(templates.animeIndexTitle, vars),
    description: fillSeoTemplate(templates.animeIndexDescription, vars),
  };
}

export function buildLocationIndexSeo(
  locale: PilgrimageLocale,
  counts: { locationCount: number },
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = { brand: BRAND_NAME, ...counts };
  return {
    title: fillSeoTemplate(templates.locationIndexTitle, vars),
    description: fillSeoTemplate(templates.locationIndexDescription, vars),
  };
}
