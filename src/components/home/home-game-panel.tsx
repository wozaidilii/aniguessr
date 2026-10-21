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
      <div className="home-play-art">
        <img
          src={`/img/game-card/${locale}.svg`}
          width={880}
          height={500}
          alt=""
        />
      </div>
      <div className="home-play-body">
        <p className="home-kicker">{copy.difficultyLabel}</p>
        <div
          className="home-seg"
          role="group"
          aria-label={copy.difficultyLabel}
        >
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
        <div
          className="home-seg home-seg-two"
          role="group"
          aria-label={copy.roundsLabel}
        >
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
        <p className="home-play-links" id="rank">
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

