import { type AnimeLocale } from "~/lib/anime-locale";
import { streetViewUnavailable } from "~/lib/street-view-status-copy";

export interface GoogleGuessMapLabels {
  answerTitle: string;
  answerMarkerLabel: string;
  guessTitle: string;
  guessMarkerLabel: string;
  loadingTitle: string;
  missingKeyTitle: string;
  loadingBody: string;
  missingKeyBody: string;
  distancePrefix: string;
}

export const GOOGLE_GUESS_MAP_LABELS: Record<
  AnimeLocale,
  GoogleGuessMapLabels
> = {
  zh: {
    answerTitle: "正确答案",
    answerMarkerLabel: "答",
    guessTitle: "你的猜测",
    guessMarkerLabel: "猜",
    loadingTitle: "正在加载 Google Maps",
    missingKeyTitle: streetViewUnavailable("zh"),
    loadingBody:
      "地图加载失败时，请确认 Google Maps JavaScript API 和 Street View 已开通。",
    missingKeyBody: "",
    distancePrefix: "偏差",
  },
  ja: {
    answerTitle: "正解地点",
    answerMarkerLabel: "正",
    guessTitle: "あなたの予想",
    guessMarkerLabel: "予",
    loadingTitle: "Google Maps を読み込み中",
    missingKeyTitle: streetViewUnavailable("ja"),
    loadingBody:
      "地図を読み込めない場合は、Google Maps JavaScript API と Street View の有効化を確認してください。",
    missingKeyBody: "",
    distancePrefix: "誤差",
  },
  en: {
    answerTitle: "Correct answer",
    answerMarkerLabel: "A",
    guessTitle: "Your guess",
    guessMarkerLabel: "G",
    loadingTitle: "Loading Google Maps",
    missingKeyTitle: streetViewUnavailable("en"),
    loadingBody:
      "If the map fails to load, confirm Google Maps JavaScript API and Street View are enabled.",
    missingKeyBody: "",
    distancePrefix: "Off by",
  },
};

export function getGoogleGuessMapLabels(locale: AnimeLocale) {
  return GOOGLE_GUESS_MAP_LABELS[locale];
}
