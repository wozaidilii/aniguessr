export const STREET_VIEW_STATUS_LOCALES = ["ja", "zh", "zh-tw", "en"] as const;
export type StreetViewStatusLocale = (typeof STREET_VIEW_STATUS_LOCALES)[number];

/** Shown when Street View is missing a key or fails to load. No env var names. */
export const STREET_VIEW_UNAVAILABLE: Record<StreetViewStatusLocale, string> = {
  ja: "ストリートビューを読み込めませんでした。しばらくしてから再読み込みしてください。",
  zh: "街景无法加载。请稍后重新加载。",
  "zh-tw": "街景無法載入。請稍後再重新載入。",
  en: "Street View could not be loaded. Please reload in a moment.",
};

export function streetViewUnavailable(locale: StreetViewStatusLocale): string {
  return STREET_VIEW_UNAVAILABLE[locale];
}
