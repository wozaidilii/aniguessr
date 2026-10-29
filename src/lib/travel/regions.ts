import { haversineKm, type NavText } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { localizedNavText } from "~/lib/pilgrimage-nav";
import type { Coordinate, TripStop } from "./types";

export const travelText = (
  zh: string,
  tw: string,
  ja: string,
  en: string,
): NavText => ({ zh, tw, ja, en });
/** Coverage circles match editorial destination guides, not country boundaries. */
export const TRAVEL_REGIONS = [
  {
    id: "tokyo",
    name: travelText("东京", "東京", "東京", "Tokyo"),
    lat: 35.68,
    lng: 139.72,
    radiusKm: 32,
    klookRegion: "tokyo",
  },
  {
    id: "shonan",
    name: travelText(
      "镰仓与江之岛",
      "鎌倉與江之島",
      "鎌倉・江の島",
      "Kamakura & Enoshima",
    ),
    lat: 35.32,
    lng: 139.51,
    radiusKm: 15,
    klookRegion: "kamakura",
  },
  {
    id: "hakone",
    name: travelText("箱根", "箱根", "箱根", "Hakone"),
    lat: 35.23,
    lng: 139.03,
    radiusKm: 17,
    klookRegion: "japan",
  },
  {
    id: "kyoto",
    name: travelText("京都与宇治", "京都與宇治", "京都・宇治", "Kyoto & Uji"),
    lat: 34.97,
    lng: 135.78,
    radiusKm: 22,
    klookRegion: "kyoto",
  },
  {
    id: "osaka",
    name: travelText("大阪", "大阪", "大阪", "Osaka"),
    lat: 34.69,
    lng: 135.5,
    radiusKm: 22,
    klookRegion: "osaka",
  },
  {
    id: "hida",
    name: travelText(
      "高山与飞驒",
      "高山與飛驒",
      "高山・飛騨",
      "Takayama & Hida",
    ),
    lat: 36.19,
    lng: 137.22,
    radiusKm: 30,
    klookRegion: "japan",
  },
  {
    id: "arima",
    name: travelText("有马温泉", "有馬溫泉", "有馬温泉", "Arima Onsen"),
    lat: 34.8,
    lng: 135.25,
    radiusKm: 8,
    klookRegion: "japan",
  },
  {
    id: "dogo",
    name: travelText(
      "松山与道后",
      "松山與道後",
      "松山・道後",
      "Matsuyama & Dogo",
    ),
    lat: 33.85,
    lng: 132.78,
    radiusKm: 12,
    klookRegion: "japan",
  },
] as const;
export type TravelRegionId = (typeof TRAVEL_REGIONS)[number]["id"];

export function travelRegionFor(point: Coordinate) {
  return TRAVEL_REGIONS.map((region) => ({
    region,
    km: haversineKm(point.lat, point.lng, region.lat, region.lng),
  }))
    .filter(({ region, km }) => km <= region.radiusKm)
    .sort((a, b) => a.km - b.km)[0]?.region;
}
export function klookRegionFor(stop: TripStop): string {
  return stop.klookRegion ?? travelRegionFor(stop)?.klookRegion ?? "global";
}
export function klookRegionLabel(
  region: string,
  locale: PilgrimageLocale,
): string {
  const named = TRAVEL_REGIONS.find(
    (item) => item.klookRegion === region && region !== "japan",
  );
  if (named) return localizedNavText(named.name, locale);
  return region === "japan"
    ? localizedNavText(travelText("日本", "日本", "日本", "Japan"), locale)
    : "Klook";
}
