import type { AnimeGuessrDifficultyTier } from "~/lib/anime-guessr";
import type { GameLocale } from "~/lib/game-locale";

/**
 * Display names only. Stored values stay beginner | intermediate | master | miracle.
 * 進階 → 中級, 奇跡 → エキスパート, and the same swap in zh/en.
 */
const LABELS: Record<
  GameLocale,
  Record<AnimeGuessrDifficultyTier, string>
> = {
  ja: {
    beginner: "入門",
    intermediate: "中級",
    master: "マスター",
    miracle: "エキスパート",
  },
  zh: {
    beginner: "入门",
    intermediate: "中级",
    master: "大师",
    miracle: "专家",
  },
  en: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    master: "Master",
    miracle: "Expert",
  },
  "zh-tw": {
    beginner: "入門",
    intermediate: "中級",
    master: "大師",
    miracle: "專家",
  },
};

const HINTS: Record<
  GameLocale,
  Record<AnimeGuessrDifficultyTier, string>
> = {
  ja: {
    beginner: "難易度1の問題だけ出題します。有名な聖地が中心です。",
    intermediate: "難易度1と2の問題を出題します。",
    master: "難易度1、2、3の問題を出題します。",
    miracle: "すべての難易度の問題を出題します。",
  },
  zh: {
    beginner: "只出难度 1 的题目，以知名圣地为主。",
    intermediate: "包含难度 1 和 2 的题目。",
    master: "包含难度 1、2 和 3 的题目。",
    miracle: "包含全部难度的题目。",
  },
  en: {
    beginner: "Difficulty 1 only, mostly well-known places.",
    intermediate: "Difficulty 1 and 2 questions.",
    master: "Difficulty 1, 2, and 3 questions.",
    miracle: "Questions from every difficulty.",
  },
  "zh-tw": {
    beginner: "只出難度 1 的題目，以知名聖地為主。",
    intermediate: "包含難度 1 和 2 的題目。",
    master: "包含難度 1、2 和 3 的題目。",
    miracle: "包含全部難度的題目。",
  },
};

const STARS: Record<AnimeGuessrDifficultyTier, 1 | 2 | 3 | 4> = {
  beginner: 1,
  intermediate: 2,
  master: 3,
  miracle: 4,
};

export function difficultyLabel(
  locale: GameLocale,
  tier: AnimeGuessrDifficultyTier,
): string {
  return LABELS[locale][tier];
}

export function difficultyHint(
  locale: GameLocale,
  tier: AnimeGuessrDifficultyTier,
): string {
  return HINTS[locale][tier];
}

export function difficultyStars(tier: AnimeGuessrDifficultyTier): string {
  return `★${STARS[tier]}`;
}
