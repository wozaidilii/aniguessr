import {
  ANIME_GUESSR_DIFFICULTY_TIERS,
  normalizeAnimeGuessrDifficultyTier,
  type AnimeGuessrDifficultyTier,
} from "~/lib/anime-guessr";

export interface AnimeDifficultySelectorCopy {
  difficultyLabel: string;
  difficultyOption: (tier: AnimeGuessrDifficultyTier) => string;
  difficultyHint: (tier: AnimeGuessrDifficultyTier) => string;
}

export function AnimeDifficultySelector({
  value,
  disabled,
  copy,
  onChange,
}: {
  value: AnimeGuessrDifficultyTier;
  disabled?: boolean;
  copy: AnimeDifficultySelectorCopy;
  onChange: (tier: AnimeGuessrDifficultyTier) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-cyan-100/60">
          {copy.difficultyLabel}
        </span>
        <div className="ag-difficulty" role="group" aria-label={copy.difficultyLabel}>
          {ANIME_GUESSR_DIFFICULTY_TIERS.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              aria-pressed={value === option}
              onClick={() =>
                onChange(normalizeAnimeGuessrDifficultyTier(option))
              }
            >
              {copy.difficultyOption(option)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs leading-5 text-pink-50/55">
        {copy.difficultyHint(value)}
      </p>
    </div>
  );
}
