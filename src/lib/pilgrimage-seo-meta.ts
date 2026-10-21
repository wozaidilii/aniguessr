import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { BRAND_NAME } from "~/lib/site-url";

/**
 * Metadata-only title and description patterns.
 * Marketing can rewrite the wording here without touching visible page copy.
 *
 * Placeholders: {brand} {anime} {place} {area} {episode} {scene} {id}
 * {count} {spotCount} {animeCount} {locationCount}
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
    spotTitle: "{anime} {place} real-life location | {brand}",
    spotTitleWithEpisode:
      "{anime} {place} ({episode}) real-life location | {brand}",
    spotTitleWithScene:
      "{anime} {place} — {scene} real-life location | {brand}",
    spotTitleWithId: "{anime} {place} real-life location ({id}) | {brand}",
    spotDescription: "Real-life location for {anime} at {place} in {area}.",
    spotDescriptionWithEpisode:
      "Real-life location for {anime} at {place} in {area}. Appears in {episode}.",
    spotDescriptionWithScene:
      "Real-life location for {anime} at {place} in {area}. Scene: {scene}.",
    spotDescriptionWithId:
      "Real-life location for {anime} at {place} in {area}. Reference {id}.",
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
    spotTitle: "{anime} {place} 撮影地 | {brand}",
    spotTitleWithEpisode: "{anime} {place}（{episode}）撮影地 | {brand}",
    spotTitleWithScene: "{anime} {place}・{scene} 撮影地 | {brand}",
    spotTitleWithId: "{anime} {place} 撮影地（{id}） | {brand}",
    spotDescription: "{anime}の{area}にある撮影地「{place}」。",
    spotDescriptionWithEpisode:
      "{anime}の{area}にある撮影地「{place}」。登場場面: {episode}。",
    spotDescriptionWithScene:
      "{anime}の{area}にある撮影地「{place}」。シーン: {scene}。",
    spotDescriptionWithId:
      "{anime}の{area}にある撮影地「{place}」。参照 {id}。",
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
    spotTitle: "{anime} {place} 取景地 | {brand}",
    spotTitleWithEpisode: "{anime} {place}（{episode}）取景地 | {brand}",
    spotTitleWithScene: "{anime} {place}·{scene} 取景地 | {brand}",
    spotTitleWithId: "{anime} {place} 取景地（{id}） | {brand}",
    spotDescription: "{anime} 在{area}的取景地「{place}」。",
    spotDescriptionWithEpisode:
      "{anime} 在{area}的取景地「{place}」。出现场景：{episode}。",
    spotDescriptionWithScene:
      "{anime} 在{area}的取景地「{place}」。场景：{scene}。",
    spotDescriptionWithId: "{anime} 在{area}的取景地「{place}」。编号 {id}。",
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
  // OpenCC s2twp of zh. zh-TW document <title> and meta description do not
  // use these templates; they come only from PILGRIMAGE_SEO_OVERRIDES.
  "zh-tw": {
    spotTitle: "{anime} {place} 取景地 | {brand}",
    spotTitleWithEpisode: "{anime} {place}（{episode}）取景地 | {brand}",
    spotTitleWithScene: "{anime} {place}·{scene} 取景地 | {brand}",
    spotTitleWithId: "{anime} {place} 取景地（{id}） | {brand}",
    spotDescription: "{anime} 在{area}的取景地「{place}」。",
    spotDescriptionWithEpisode:
      "{anime} 在{area}的取景地「{place}」。出現場景：{episode}。",
    spotDescriptionWithScene:
      "{anime} 在{area}的取景地「{place}」。場景：{scene}。",
    spotDescriptionWithId: "{anime} 在{area}的取景地「{place}」。編號 {id}。",
    animeTitle: "{anime} 取景地 | {brand}",
    animeTitleWithId: "{anime}（{id}）取景地 | {brand}",
    animeDescription: "{anime} 的實景取景地共 {count} 處，含座標與場景資訊。",
    animeDescriptionWithId:
      "{anime}（{id}）的實景取景地共 {count} 處，含座標與場景資訊。",
    locationTitle: "{area} 動漫取景地 | {brand}",
    locationDescription: "{area} 的動漫取景地共 {count} 處。",
    hubTitle: "動漫取景地與聖地巡禮 | {brand}",
    hubDescription:
      "收錄 {animeCount} 部作品、{locationCount} 個地區、共 {spotCount} 處動漫取景地。",
    animeIndexTitle: "按作品瀏覽動漫取景地 | {brand}",
    animeIndexDescription: "已收錄取景地的動漫作品共 {animeCount} 部。",
    locationIndexTitle: "按地區瀏覽動漫取景地 | {brand}",
    locationIndexDescription: "已收錄動漫取景地的地區共 {locationCount} 個。",
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

function spotVars(fields: SpotSeoFields): Record<string, string> {
  return {
    brand: BRAND_NAME,
    anime: fields.anime,
    place: fields.place,
    area: fields.area,
    episode: fields.episode,
    scene: fields.scene,
    id: fields.id,
  };
}

export function buildSpotSeo(
  locale: PilgrimageLocale,
  fields: SpotSeoFields,
  variant: SpotSeoVariant,
): RenderedSeo {
  const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
  const vars = spotVars(fields);
  const titleTemplate = {
    base: templates.spotTitle,
    episode: templates.spotTitleWithEpisode,
    scene: templates.spotTitleWithScene,
    id: templates.spotTitleWithId,
  }[variant];
  const descriptionTemplate = {
    base: templates.spotDescription,
    episode: templates.spotDescriptionWithEpisode,
    scene: templates.spotDescriptionWithScene,
    id: templates.spotDescriptionWithId,
  }[variant];
  return {
    title: fillSeoTemplate(titleTemplate, vars),
    description: fillSeoTemplate(descriptionTemplate, vars),
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
