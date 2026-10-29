import { localizedNavText, type NavText } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  travelRegionFor,
  travelText as t,
  type TravelRegionId,
} from "./regions";
import type { TravelInterest, TripPlan, TripState } from "./types";

export type GuideTopic = TravelInterest | "anime" | "transport";
export interface TravelGuide {
  id: string;
  title: NavText;
  publisher: string;
  url: string;
  language: "en" | "zh-tw";
  kind: "official" | "editorial" | "platform";
  regions: TravelRegionId[];
  topics: GuideTopic[];
  checkedAt: string;
}
const checkedAt = "2026-10-29";
/** Short original descriptions of linked resources; no republished article content. */
export const TRAVEL_GUIDES: TravelGuide[] = [
  {
    id: "tokyo-anime",
    title: t(
      "东京动漫与漫画旅行指南",
      "東京動漫與漫畫旅行指南",
      "東京のアニメ・漫画ガイド",
      "Tokyo manga and anime guide",
    ),
    publisher: "japan-guide.com",
    url: "https://www.japan-guide.com/e/e3052.html",
    language: "en",
    kind: "editorial",
    regions: ["tokyo"],
    topics: ["anime", "sightseeing"],
    checkedAt,
  },
  {
    id: "tokyo-walks",
    title: t(
      "东京步行路线与一日行程",
      "東京步行路線與一日行程",
      "東京の散策・モデルコース",
      "Tokyo walks and itineraries",
    ),
    publisher: "japan-guide.com",
    url: "https://www.japan-guide.com/e/e3051.html",
    language: "en",
    kind: "editorial",
    regions: ["tokyo"],
    topics: ["sightseeing", "transport"],
    checkedAt,
  },
  {
    id: "shonan-klook",
    title: t(
      "江之岛与镰仓一日游攻略",
      "江之島與鎌倉一日遊攻略",
      "江の島・鎌倉日帰りガイド",
      "Enoshima and Kamakura day-trip guide",
    ),
    publisher: "Klook Taiwan",
    url: "https://www.klook.com/zh-TW/blog/tokyo-enoshima/",
    language: "zh-tw",
    kind: "platform",
    regions: ["shonan"],
    topics: ["anime", "sightseeing", "food", "transport"],
    checkedAt,
  },
  {
    id: "shonan-odakyu",
    title: t(
      "小田急镰仓与江之岛交通旅行指南",
      "小田急鎌倉與江之島交通旅行指南",
      "小田急 江の島・鎌倉ガイド",
      "Odakyu Enoshima and Kamakura guide",
    ),
    publisher: "Odakyu",
    url: "https://odakyu-global.com/destinations/enoshima-kamakura/",
    language: "en",
    kind: "official",
    regions: ["shonan"],
    topics: ["transport", "sightseeing"],
    checkedAt,
  },
  {
    id: "hakone-routes",
    title: t(
      "箱根官方主题行程",
      "箱根官方主題行程",
      "箱根のテーマ別モデルコース",
      "Hakone themed itineraries",
    ),
    publisher: "Hakone Navi",
    url: "https://www.hakonenavi.jp/international/en/course",
    language: "en",
    kind: "official",
    regions: ["hakone"],
    topics: ["sightseeing", "onsen", "transport"],
    checkedAt,
  },
  {
    id: "kyoto-walks",
    title: t(
      "京都步行路线与一日行程",
      "京都步行路線與一日行程",
      "京都の散策・モデルコース",
      "Kyoto walks and itineraries",
    ),
    publisher: "japan-guide.com",
    url: "https://www.japan-guide.com/e/e3950.html",
    language: "en",
    kind: "editorial",
    regions: ["kyoto"],
    topics: ["sightseeing", "transport"],
    checkedAt,
  },
  {
    id: "uji-klook",
    title: t(
      "宇治景点、抹茶与交通攻略",
      "宇治景點、抹茶與交通攻略",
      "宇治の観光・抹茶・交通ガイド",
      "Uji sights, tea and transport guide",
    ),
    publisher: "Klook Taiwan",
    url: "https://www.klook.com/zh-TW/blog/kyoto-uji-spots/",
    language: "zh-tw",
    kind: "platform",
    regions: ["kyoto"],
    topics: ["sightseeing", "food", "transport"],
    checkedAt,
  },
  {
    id: "osaka-walks",
    title: t(
      "大阪步行路线与行程",
      "大阪步行路線與行程",
      "大阪の散策・モデルコース",
      "Osaka walks and itineraries",
    ),
    publisher: "japan-guide.com",
    url: "https://www.japan-guide.com/e/e4028.html",
    language: "en",
    kind: "editorial",
    regions: ["osaka"],
    topics: ["sightseeing", "transport"],
    checkedAt,
  },
  {
    id: "osaka-food",
    title: t(
      "大阪地方美食指南",
      "大阪地方美食指南",
      "大阪の食ガイド",
      "Osaka food guide",
    ),
    publisher: "japan-guide.com",
    url: "https://www.japan-guide.com/e/e4022.html",
    language: "en",
    kind: "editorial",
    regions: ["osaka"],
    topics: ["food"],
    checkedAt,
  },
  {
    id: "hida-walk",
    title: t(
      "飞驒古川濑户川与白壁街区",
      "飛驒古川瀨戶川與白壁街區",
      "飛騨古川 瀬戸川と白壁土蔵街",
      "Hida-Furukawa Setogawa and white-walled streets",
    ),
    publisher: "Hida Takayama tourism",
    url: "https://www.hida.jp/english/touristattractions/4001419/4000090.html",
    language: "en",
    kind: "official",
    regions: ["hida"],
    topics: ["sightseeing"],
    checkedAt,
  },
  {
    id: "dogo-bathing",
    title: t(
      "道后温泉参观与入浴指南",
      "道後溫泉參觀與入浴指南",
      "道後温泉の利用ガイド",
      "Dogo Onsen visitor and bathing guide",
    ),
    publisher: "Dogo Onsen",
    url: "https://dogo.jp/en/",
    language: "en",
    kind: "official",
    regions: ["dogo"],
    topics: ["onsen", "sightseeing"],
    checkedAt,
  },
];

export interface GuideRecommendation {
  guide: TravelGuide;
  regions: TravelRegionId[];
  topics: GuideTopic[];
}

export function recommendGuides(
  plan: TripPlan,
  state: TripState,
  locale: PilgrimageLocale,
): GuideRecommendation[] {
  // Unscheduled places do not imply that the user will visit their destination.
  const stops = plan.days.flatMap((day) => day.stops.map(({ stop }) => stop));
  const regions = [
    ...new Set(
      stops.flatMap((stop) => {
        const region = travelRegionFor(stop);
        return region ? [region.id] : [];
      }),
    ),
  ];
  const interests: GuideTopic[] = [...state.interests, "transport"];
  if (stops.some((stop) => stop.kind === "anime") || state.animeIds.length)
    interests.push("anime");
  const ranked = TRAVEL_GUIDES.map((guide) => ({
    guide,
    regions: guide.regions.filter((id) => regions.includes(id)),
    topics: guide.topics.filter((topic) => interests.includes(topic)),
  }))
    .filter((item) => item.regions.length && item.topics.length)
    .sort((a, b) => {
      const score = (item: GuideRecommendation) =>
        item.topics.length * 2 +
        Number(
          item.guide.language === locale ||
            (locale === "zh" && item.guide.language === "zh-tw"),
        ) *
          2;
      return score(b) - score(a) || a.guide.id.localeCompare(b.guide.id);
    });
  const selected: GuideRecommendation[] = [];
  const add = (item: GuideRecommendation | undefined) => {
    if (item && !selected.some((other) => other.guide.id === item.guide.id))
      selected.push(item);
  };
  // Give every scheduled destination a useful source before adding more for one city.
  for (const region of regions)
    add(ranked.find((item) => item.regions.includes(region)));
  for (const item of ranked) {
    if (selected.length >= 8) break;
    const duplicates = selected.filter(
      (other) =>
        other.guide.publisher === item.guide.publisher &&
        other.regions.some((region) => item.regions.includes(region)),
    ).length;
    if (duplicates < 2) add(item);
  }
  return selected.slice(0, 8);
}

export function guideTitle(guide: TravelGuide, locale: PilgrimageLocale) {
  return localizedNavText(guide.title, locale);
}
