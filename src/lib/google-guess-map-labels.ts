import { type GameLocale } from "~/lib/game-locale";
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
  GameLocale,
  GoogleGuessMapLabels
> = {
  zh: {
    answerTitle: "正确答案",
    answerMarkerLabel: "答",
    guessTitle: "你的猜测",
    guessMarkerLabel: "猜",
    loadingTitle: "正在加载地图",
    missingKeyTitle: streetViewUnavailable("zh"),
    loadingBody: "地图暂时无法显示。请稍后重新加载。",
    missingKeyBody: "",
    distancePrefix: "偏差",
  },
  "zh-tw": {
    answerTitle: "正確答案",
    answerMarkerLabel: "答",
    guessTitle: "你的猜測",
    guessMarkerLabel: "猜",
    loadingTitle: "正在載入地圖",
    missingKeyTitle: streetViewUnavailable("zh-tw"),
    loadingBody: "地圖暫時無法顯示。請稍後重新載入。",
    missingKeyBody: "",
    distancePrefix: "偏差",
  },
  ja: {
    answerTitle: "正解地点",
    answerMarkerLabel: "正",
    guessTitle: "あなたの予想",
    guessMarkerLabel: "予",
    loadingTitle: "地図を読み込み中",
    missingKeyTitle: streetViewUnavailable("ja"),
    loadingBody: "地図を表示できません。しばらくしてから再読み込みしてください。",
    missingKeyBody: "",
    distancePrefix: "誤差",
  },
  en: {
    answerTitle: "Correct answer",
    answerMarkerLabel: "A",
    guessTitle: "Your guess",
    guessMarkerLabel: "G",
    loadingTitle: "Loading map",
    missingKeyTitle: streetViewUnavailable("en"),
    loadingBody: "The map could not be shown. Please reload in a moment.",
    missingKeyBody: "",
    distancePrefix: "Off by",
  },
};

export function getGoogleGuessMapLabels(locale: GameLocale) {
  return GOOGLE_GUESS_MAP_LABELS[locale];
}
