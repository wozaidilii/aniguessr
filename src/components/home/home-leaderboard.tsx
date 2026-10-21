"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  getAnimeGuessrDifficultyTierFromSearch,
  getAnimeGuessrRoundCountFromSearch,
  getStoredAnimeGuessrDifficultyTier,
  getStoredAnimeGuessrRoundCount,
  type AnimeGuessrDifficultyTier,
  type AnimeGuessrRoundCount,
} from "~/lib/anime-guessr";
import { withAnimeLocale } from "~/lib/anime-locale";
import { countryCodeToFlagEmoji } from "~/lib/country";
import { homeDifficultyTiers, getHomePageCopy } from "~/lib/home-page-copy";
import { homeSiteLocale, type HomeLocale } from "~/lib/home-locale";
import { getStoredPlayerSession } from "~/lib/player-session";
import { api } from "~/trpc/react";

function avatarStyle(url: string | null | undefined): CSSProperties | undefined {
  if (!url) return undefined;
  return { backgroundImage: `url("${url.replace(/"/g, "%22")}")` };
}

/** Existing ranking URL: /{locale}#rank, including ?difficulty=&rounds= from the game. */
export function HomeLeaderboard({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const siteLocale = homeSiteLocale(locale);
  const [rounds, setRounds] = useState<AnimeGuessrRoundCount>(5);
  const [tier, setTier] = useState<AnimeGuessrDifficultyTier>(
    ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  );
  const [token, setToken] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromSearchRounds = getAnimeGuessrRoundCountFromSearch(
      window.location.search,
    );
    const fromSearchTier = getAnimeGuessrDifficultyTierFromSearch(
      window.location.search,
    );
    setRounds(fromSearchRounds ?? getStoredAnimeGuessrRoundCount());
    setTier(fromSearchTier ?? getStoredAnimeGuessrDifficultyTier());
    setToken(getStoredPlayerSession()?.token);
    setReady(true);
  }, []);

  const query = api.player.leaderboard.useQuery(
    { token, limit: 5, rounds, difficultyTier: tier },
    { enabled: ready, retry: false },
  );
  const entries = query.data?.entries ?? [];
  const current = query.data?.currentUserEntry;
  const showCurrent =
    current && !entries.some((entry) => entry.userId === current.userId);
  const loginHref = withAnimeLocale("/login", siteLocale);

  return (
    <section className="home-rank" id="rank">
      <div className="home-wrap">
        <div className="home-sec-h">
          <div>
            <p className="home-eyebrow">{copy.gameEyebrow}</p>
            <h2>{copy.rankTitle}</h2>
            <p>{copy.rankBody}</p>
          </div>
        </div>
        <div className="home-rank-controls">
          <div className="home-seg" role="group" aria-label={copy.difficultyLabel}>
            {homeDifficultyTiers().map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={tier === option}
                onClick={() => setTier(option)}
              >
                {copy.difficultyOption(option)}
              </button>
            ))}
          </div>
          <div className="home-seg home-seg-two" role="group" aria-label={copy.roundsLabel}>
            {([5, 10] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={rounds === option}
                onClick={() => setRounds(option)}
              >
                {copy.roundsOption(option)}
              </button>
            ))}
          </div>
        </div>
        <div className="home-board">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                key={entry.userId}
                className={`home-row${entry.isCurrentUser ? " is-me" : ""}`}
              >
                <span>{String(entry.rank).padStart(2, "0")}</span>
                <span>
                  <i
                    className="home-avatar"
                    style={{
                      backgroundColor: entry.avatar.color,
                      ...avatarStyle(entry.avatarUrl),
                    }}
                  />
                  {countryCodeToFlagEmoji(entry.countryCode)} {entry.name}
                </span>
                <b>{entry.score.toLocaleString()}</b>
              </div>
            ))
          ) : (
            <p className="home-empty">
              {!ready || query.isLoading ? copy.rankLoading : copy.rankEmpty}
            </p>
          )}
          {showCurrent && current ? (
            <div className="home-row is-me">
              <span>{String(current.rank).padStart(2, "0")}</span>
              <span>
                {copy.myRank}: {current.name}
              </span>
              <b>{current.score.toLocaleString()}</b>
            </div>
          ) : null}
          {ready && !token ? (
            <a className="home-row is-me" href={loginHref}>
              <span>—</span>
              <span>{copy.rankGuest}</span>
              <b>{copy.rankLogin}</b>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
