"use client";

import { useEffect, useState } from "react";
import {
  ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  ANIME_GUESSR_ROUND_OPTIONS,
  getAnimeGuessrDifficultyTierFromSearch,
  getAnimeGuessrRoundCountFromSearch,
  getStoredAnimeGuessrDifficultyTier,
  getStoredAnimeGuessrRoundCount,
  saveAnimeGuessrDifficultyTier,
  saveAnimeGuessrRoundCount,
  type AnimeGuessrDifficultyTier,
  type AnimeGuessrRoundCount,
} from "~/lib/anime-guessr";
import { withAnimeLocale } from "~/lib/anime-locale";
import { homeDifficultyTiers, getHomePageCopy } from "~/lib/home-page-copy";
import { homeSiteLocale, type HomeLocale } from "~/lib/home-locale";
import { capturePostHogEvent, POSTHOG_EVENTS } from "~/lib/posthog";

export function HomeGamePanel({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const siteLocale = homeSiteLocale(locale);
  const [rounds, setRounds] = useState<AnimeGuessrRoundCount>(5);
  const [tier, setTier] = useState<AnimeGuessrDifficultyTier>(
    ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  );

  useEffect(() => {
    const fromSearchRounds = getAnimeGuessrRoundCountFromSearch(
      window.location.search,
    );
    const fromSearchTier = getAnimeGuessrDifficultyTierFromSearch(
      window.location.search,
    );
    const nextRounds = fromSearchRounds ?? getStoredAnimeGuessrRoundCount();
    const nextTier = fromSearchTier ?? getStoredAnimeGuessrDifficultyTier();
    setRounds(nextRounds);
    setTier(nextTier);
    if (fromSearchRounds) saveAnimeGuessrRoundCount(nextRounds);
    if (fromSearchTier) saveAnimeGuessrDifficultyTier(nextTier);
  }, []);

  const playHref = withAnimeLocale(
    `/game/anime?rounds=${rounds}&difficulty=${tier}`,
    siteLocale,
  );
  const battleHref = withAnimeLocale("/battle", siteLocale);

  return (
    <div className="home-play">
      <div className="home-play-art" aria-hidden="true">
        <GameArt />
        <span>ROUND 1/5</span>
      </div>
      <div className="home-play-body">
        <p className="home-kicker">{copy.difficultyLabel}</p>
        <div className="home-seg" role="group" aria-label={copy.difficultyLabel}>
          {homeDifficultyTiers().map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tier === option}
              onClick={() => {
                setTier(option);
                saveAnimeGuessrDifficultyTier(option);
              }}
            >
              {copy.difficultyOption(option)}
            </button>
          ))}
        </div>
        <p className="home-kicker">{copy.roundsLabel}</p>
        <div className="home-seg home-seg-two" role="group" aria-label={copy.roundsLabel}>
          {ANIME_GUESSR_ROUND_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={rounds === option}
              onClick={() => {
                setRounds(option);
                saveAnimeGuessrRoundCount(option);
              }}
            >
              {copy.roundsOption(option)}
            </button>
          ))}
        </div>
        <a
          className="home-btn home-btn-primary home-btn-block"
          href={playHref}
          onClick={() =>
            capturePostHogEvent(POSTHOG_EVENTS.homeStartClicked, {
              locale: siteLocale,
              rounds,
              difficulty: tier,
            })
          }
        >
          {copy.start}
        </a>
        <p className="home-play-links">
          <a
            href={battleHref}
            onClick={() =>
              capturePostHogEvent(POSTHOG_EVENTS.homeBattleClicked, {
                locale: siteLocale,
              })
            }
          >
            {copy.gameBattle}
          </a>
          <a href="#rank">{copy.gameRank}</a>
        </p>
      </div>
    </div>
  );
}

function GameArt() {
  return (
    <svg viewBox="0 0 480 190" className="home-play-svg">
      <defs>
        <linearGradient id="home-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1848" />
          <stop offset="1" stopColor="#12081f" />
        </linearGradient>
      </defs>
      <rect width="480" height="190" fill="url(#home-sky)" />
      <circle cx="390" cy="48" r="18" fill="#f8e7ff" opacity="0.85" />
      <path d="M0 128h480" stroke="#3a2c55" strokeWidth="2" />
      <path d="M40 128 L120 78 L200 128" fill="#1a1230" />
      <path d="M180 128 L280 64 L380 128" fill="#241838" />
      <path d="M0 150 L240 118 L480 150 L480 190 L0 190 Z" fill="#161022" />
      <path d="M220 150 L240 118 L260 150" fill="#67e8f9" opacity="0.35" />
      <text x="240" y="96" textAnchor="middle" fill="#f9a8d4" fontSize="42" fontFamily="Sora, sans-serif" fontWeight="700">
        ?
      </text>
    </svg>
  );
}
