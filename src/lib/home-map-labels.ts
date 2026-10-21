import type { HomeLocale } from "~/lib/home-locale";

export interface HomeMapLabel {
  id: string;
  ja: string;
  zh: string;
  tw: string;
  en: string;
  count: number;
  lng: number;
  lat: number;
  west: number;
  south: number;
  east: number;
  north: number;
  major: boolean;
}

export interface HomeMapLabels {
  version: 1;
  areas: HomeMapLabel[];
  prefectures: HomeMapLabel[];
}

export function homeMapLabelText(
  label: HomeMapLabel,
  locale: HomeLocale,
): string {
  if (locale === "zh") return label.zh || label.ja;
  if (locale === "zh-tw") return label.tw || label.zh || label.ja;
  if (locale === "en") return label.en || label.ja;
  return label.ja;
}

export async function loadHomeMapLabels(): Promise<HomeMapLabels | null> {
  const response = await fetch("/data/seo/home-map-labels.json");
  if (!response.ok) return null;
  const value: unknown = await response.json();
  if (!value || typeof value !== "object") return null;
  const record = value as {
    version?: unknown;
    areas?: unknown;
    prefectures?: unknown;
  };
  if (
    record.version !== 1 ||
    !Array.isArray(record.areas) ||
    !Array.isArray(record.prefectures)
  ) {
    return null;
  }
  return value as HomeMapLabels;
}
