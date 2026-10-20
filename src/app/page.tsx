"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowIcon } from "~/components/brand/ArrowIcon";
import { MiniMapArt } from "~/components/brand/MiniMapArt";
import { SiteFooter } from "~/components/brand/SiteFooter";
import { SiteHeader } from "~/components/brand/SiteHeader";
import { HomeStructuredData } from "~/components/HomeStructuredData";
import { useAnimeLocale } from "~/hooks/use-anime-locale";
import {
  CONTACT_GENERAL_EMAIL,
  CONTACT_SUPPORT_EMAIL,
  HOME_COPY,
} from "~/lib/aniguessr-copy";
import {
  saveAnimeLocale,
  stripLocalePrefix,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import {
  ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  ANIME_GUESSR_DIFFICULTY_TIERS,
  getAnimeGuessrDifficultyTierFromSearch,
  getAnimeGuessrRoundCountFromSearch,
  getStoredAnimeGuessrDifficultyTier,
  getStoredAnimeGuessrRoundCount,
  saveAnimeGuessrDifficultyTier,
  saveAnimeGuessrRoundCount,
  type AnimeGuessrDifficultyTier,
  type AnimeGuessrRoundCount,
} from "~/lib/anime-guessr";
import { COUNTRY_OPTIONS, countryCodeToFlagEmoji } from "~/lib/country";
import {
  difficultyHint,
  difficultyLabel,
  difficultyStars,
} from "~/lib/difficulty-labels";
import {
  clearPlayerSession,
  getStoredPlayerSession,
  savePlayerSession,
} from "~/lib/player-session";
import {
  capturePostHogEvent,
  identifyPostHogUser,
  POSTHOG_EVENTS,
  resetPostHogUser,
} from "~/lib/posthog";
import { type PlayerSession } from "~/types/player";
import { api } from "~/trpc/react";

function avatarImageStyle(
  url: string | null | undefined,
): CSSProperties | undefined {
  if (!url) return undefined;
  return { backgroundImage: `url("${url.replace(/"/g, "%22")}")` };
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useAnimeLocale();
  const copy = HOME_COPY[locale];
  const [leaderboardRounds, setLeaderboardRounds] = useState<5 | 10>(5);
  const [leaderboardDifficultyTier, setLeaderboardDifficultyTier] =
    useState<AnimeGuessrDifficultyTier>(ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER);
  const [selectedRoundCount, setSelectedRoundCount] =
    useState<AnimeGuessrRoundCount>(5);
  const [difficultyTier, setDifficultyTier] =
    useState<AnimeGuessrDifficultyTier>(ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileCountryCode, setProfileCountryCode] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const playUrl = withAnimeLocale(
    `/game/anime?rounds=${selectedRoundCount}&difficulty=${difficultyTier}`,
    locale,
  );
  const loginUrl = withAnimeLocale("/login", locale);
  const localizedBattleUrl = withAnimeLocale("/battle", locale);
  const battleUrl = session
    ? localizedBattleUrl
    : withAnimeLocale(
        `/login?next=${encodeURIComponent(localizedBattleUrl)}`,
        locale,
      );
  const pilgrimageUrl = withAnimeLocale("/pilgrimage", locale);
  const meQuery = api.player.me.useQuery(
    { token: session?.token ?? "" },
    { enabled: Boolean(session?.token), retry: false },
  );
  const leaderboardQuery = api.player.leaderboard.useQuery(
    {
      token: session?.token,
      limit: 5,
      rounds: leaderboardRounds,
      difficultyTier: leaderboardDifficultyTier,
    },
    { retry: false },
  );
  const updateProfile = api.player.updateProfile.useMutation({
    onSuccess(user) {
      if (!session) return;
      const nextSession = { token: session.token, user };
      savePlayerSession(nextSession);
      identifyPostHogUser(user);
      setSession(nextSession);
      setProfileName(user.name);
      setProfileCountryCode(user.countryCode ?? "");
      setProfileMessage(copy.saved);
      capturePostHogEvent(
        POSTHOG_EVENTS.profileUpdated,
        { has_country: Boolean(user.countryCode) },
        user.id,
      );
      void leaderboardQuery.refetch();
    },
  });

  useEffect(() => {
    const roundsFromSearch = getAnimeGuessrRoundCountFromSearch(
      window.location.search,
    );
    const difficultyFromSearch = getAnimeGuessrDifficultyTierFromSearch(
      window.location.search,
    );
    const storedRoundCount = getStoredAnimeGuessrRoundCount();
    const storedDifficultyTier = getStoredAnimeGuessrDifficultyTier();
    const nextRoundCount = roundsFromSearch ?? storedRoundCount;
    const nextDifficultyTier = difficultyFromSearch ?? storedDifficultyTier;

    setSelectedRoundCount(nextRoundCount);
    setLeaderboardRounds(nextRoundCount);
    setDifficultyTier(nextDifficultyTier);
    setLeaderboardDifficultyTier(nextDifficultyTier);
    if (difficultyFromSearch) {
      saveAnimeGuessrDifficultyTier(nextDifficultyTier);
    }
    if (roundsFromSearch) {
      saveAnimeGuessrRoundCount(nextRoundCount);
    }
    const storedSession = getStoredPlayerSession();
    setSession(storedSession);
    if (storedSession) identifyPostHogUser(storedSession.user);
    setProfileName(storedSession?.user.name ?? "");
    setProfileCountryCode(storedSession?.user.countryCode ?? "");
  }, []);

  useEffect(() => {
    if (!meQuery.data) return;
    setSession((current) => {
      if (!current) return current;
      const nextSession = { token: current.token, user: meQuery.data };
      savePlayerSession(nextSession);
      identifyPostHogUser(meQuery.data);
      return nextSession;
    });
    setProfileName(meQuery.data.name);
    setProfileCountryCode(meQuery.data.countryCode ?? "");
  }, [meQuery.data]);

  function handleRoundCountChange(nextRoundCount: AnimeGuessrRoundCount) {
    setSelectedRoundCount(nextRoundCount);
    saveAnimeGuessrRoundCount(nextRoundCount);
  }

  function handleDifficultyTierChange(
    nextDifficultyTier: AnimeGuessrDifficultyTier,
  ) {
    setDifficultyTier(nextDifficultyTier);
    setLeaderboardDifficultyTier(nextDifficultyTier);
    saveAnimeGuessrDifficultyTier(nextDifficultyTier);
  }

  function handleLeaderboardDifficultyTierChange(
    nextDifficultyTier: AnimeGuessrDifficultyTier,
  ) {
    setLeaderboardDifficultyTier(nextDifficultyTier);
    setDifficultyTier(nextDifficultyTier);
    saveAnimeGuessrDifficultyTier(nextDifficultyTier);
  }

  function selectLocale(nextLocale: AnimeLocale) {
    saveAnimeLocale(nextLocale);
    const innerPath = stripLocalePrefix(pathname);
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.push(withAnimeLocale(`${innerPath}${search}`, nextLocale));
  }

  function handleSaveProfile() {
    if (!session) return;
    setProfileMessage("");
    updateProfile.mutate({
      token: session.token,
      name: profileName,
      avatar: session.user.avatar,
      countryCode: profileCountryCode || null,
    });
  }

  function handleLogout() {
    clearPlayerSession();
    resetPostHogUser();
    setSession(null);
    setProfileName("");
    setProfileCountryCode("");
    setProfileMessage("");
    setProfileMenuOpen(false);
    void leaderboardQuery.refetch();
  }

  const leaderboard = leaderboardQuery.data?.entries ?? [];
  const currentUserEntry = leaderboardQuery.data?.currentUserEntry;
  const showDetachedCurrentUser =
    currentUserEntry &&
    !leaderboard.some((entry) => entry.userId === currentUserEntry.userId);

  const headerAction = session ? (
    <>
      <button
        type="button"
        aria-label={copy.profileTitle}
        aria-expanded={profileMenuOpen}
        aria-controls="home-profile-menu"
        onClick={() =>
          setProfileMenuOpen((value) => {
            const nextValue = !value;
            if (nextValue) {
              capturePostHogEvent(
                POSTHOG_EVENTS.profileOpened,
                { source: "home" },
                session.user.id,
              );
            }
            return nextValue;
          })
        }
        className="ag-avatar"
        style={{
          width: 40,
          height: 40,
          border: "1px solid var(--ag-line2)",
          backgroundColor: session.user.avatar.color,
          ...avatarImageStyle(session.user.avatarUrl),
        }}
      >
        {session.user.avatarUrl ? null : session.user.avatar.icon}
      </button>
      {profileMenuOpen && (
        <section id="home-profile-menu" className="ag-profile">
          <h2 className="text-lg font-bold">{copy.profileTitle}</h2>
          <p className="mt-1 truncate text-xs" style={{ color: "var(--ag-tx3)" }}>
            {session.user.email ?? session.user.provider ?? "player"}
          </p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-bold" style={{ color: "var(--ag-tx2)" }}>
              {copy.username}
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                maxLength={12}
              />
            </label>
            <div className="grid gap-2 text-xs font-bold" style={{ color: "var(--ag-tx2)" }}>
              <span>{copy.country}</span>
              <div
                role="radiogroup"
                aria-label={copy.country}
                className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto pr-1"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={profileCountryCode === ""}
                  aria-label={copy.countryUnset}
                  title={copy.countryUnset}
                  onClick={() => setProfileCountryCode("")}
                  className="ag-flag"
                >
                  {countryCodeToFlagEmoji(null)}
                </button>
                {COUNTRY_OPTIONS.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    role="radio"
                    aria-checked={profileCountryCode === country.code}
                    aria-label={country.label}
                    title={country.label}
                    onClick={() => setProfileCountryCode(country.code)}
                    className="ag-flag"
                  >
                    {countryCodeToFlagEmoji(country.code)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending || profileName.trim().length === 0}
                className="ag-btn ag-btn-pink ag-btn-sm"
                style={{ flex: 1 }}
              >
                {updateProfile.isPending ? copy.saving : copy.saveProfile}
              </button>
              <button type="button" onClick={handleLogout} className="ag-btn ag-btn-line ag-btn-sm">
                {copy.logout}
              </button>
            </div>
            {(profileMessage || updateProfile.error) && (
              <p className="text-xs" style={{ color: "var(--ag-tx3)" }}>
                {updateProfile.error?.message ?? profileMessage}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  ) : (
    <Link href={loginUrl} className="ag-btn ag-btn-line ag-btn-sm">
      {copy.login}
    </Link>
  );

  return (
    <main style={{ background: "var(--ag-bg)", color: "var(--ag-tx)" }}>
      <HomeStructuredData locale={locale} />
      <section className="ag-hero">
        <SiteHeader locale={locale} onSelectLocale={selectLocale} action={headerAction} />
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/aniguessr/hero-seaside-mobile.jpg" />
          <img src="/images/aniguessr/hero-seaside.jpg" alt="" />
        </picture>
        <div className="ag-hero-scrim" />
        <div className="ag-hero-copy">
          <div className="ag-hero-grid">
            <div>
              <p className="ag-eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="ag-lead">{copy.lead}</p>
              <div className="ag-stats">
                <div>
                  <b>{copy.statArchiveValue}</b>
                  <span>{copy.statArchiveLabel}</span>
                </div>
                <div>
                  <b>{copy.statRoundsValue}</b>
                  <span>{copy.statRoundsLabel}</span>
                </div>
                <div>
                  <b>{copy.statBattleValue}</b>
                  <span>{copy.statBattleLabel}</span>
                </div>
              </div>
            </div>
            <div className="ag-play">
              <h2>
                {copy.playTitle}
                <small>{copy.playNote}</small>
              </h2>
              <p className="ag-lbl">{copy.difficultyLabel}</p>
              <div className="ag-seg" role="group" aria-label={copy.difficultyLabel}>
                {ANIME_GUESSR_DIFFICULTY_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={difficultyTier === tier}
                    onClick={() => handleDifficultyTierChange(tier)}
                  >
                    {difficultyLabel(locale, tier)}
                    <i>{difficultyStars(tier)}</i>
                  </button>
                ))}
              </div>
              <p className="ag-diffnote">{difficultyHint(locale, difficultyTier)}</p>
              <p className="ag-lbl">{copy.roundsLabel}</p>
              <div className="ag-seg two" role="group" aria-label={copy.roundsLabel}>
                {([5, 10] as const).map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    aria-pressed={selectedRoundCount === rounds}
                    onClick={() => handleRoundCountChange(rounds)}
                  >
                    {copy.roundsOption(rounds)}
                  </button>
                ))}
              </div>
              <Link
                href={playUrl}
                className="ag-btn ag-btn-pink ag-go"
                onClick={() =>
                  capturePostHogEvent(POSTHOG_EVENTS.homeStartClicked, {
                    locale,
                    rounds: selectedRoundCount,
                    difficulty: difficultyTier,
                  })
                }
              >
                {copy.start} <ArrowIcon />
              </Link>
              <div className="ag-modes">
                <Link
                  href={battleUrl}
                  className="ag-mode"
                  onClick={() =>
                    capturePostHogEvent(POSTHOG_EVENTS.homeBattleClicked, {
                      locale,
                      loggedIn: Boolean(session),
                    })
                  }
                >
                  <span className="ag-mode-ic" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 16L16 4M12 4h4v4M4 4l4 4M12 12l4 4" />
                    </svg>
                  </span>
                  <span>
                    <b>{copy.battleTitle}</b>
                    <span>{copy.battleHint}</span>
                  </span>
                </Link>
                <Link href="#pilgrim" className="ag-mode">
                  <span className="ag-mode-ic" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M10 18s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" />
                      <circle cx="10" cy="8" r="2" />
                    </svg>
                  </span>
                  <span>
                    <b>{copy.pilgrimageTitle}</b>
                    <span>{copy.pilgrimageHint}</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ag-how" id="how">
        <div className="ag-wrap">
          <div className="ag-sh">
            <div>
              <p className="ag-eyebrow">{copy.howEyebrow}</p>
              <h2>{copy.howTitle}</h2>
            </div>
            <p>{copy.howBody}</p>
          </div>
          <div className="ag-steps">
            {copy.steps.map((step, index) => (
              <article className="ag-step" key={step.title}>
                <div className="ag-step-visual">
                  {index === 0 && <img src="/images/aniguessr/clue.jpg" alt="" />}
                  {index === 1 && <img src="/images/aniguessr/street.jpg" alt="" />}
                  {index === 2 && <MiniMapArt />}
                  <span className="ag-chip" style={{ left: 14, top: 14 }}>
                    {step.kicker}
                  </span>
                </div>
                <div className="ag-step-body">
                  <p className="ag-step-n">0{index + 1}</p>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-pilgrim" id="pilgrim">
        <img src="/images/aniguessr/clue.jpg" alt="" />
        <div className="ag-wrap">
          <p className="ag-eyebrow">{copy.pilgrimEyebrow}</p>
          <h2>{copy.pilgrimTitle}</h2>
          <p>{copy.pilgrimBody}</p>
          <div style={{ marginTop: 32 }}>
            <Link href={pilgrimageUrl} className="ag-btn ag-btn-line">
              {copy.pilgrimCta} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="ag-rank" id="rank">
        <div className="ag-wrap">
          <div className="ag-rank-grid">
            <div>
              <p className="ag-eyebrow">{copy.rankEyebrow}</p>
              <h2>{copy.rankTitle}</h2>
              <p className="ag-rank-lead">{copy.rankBody}</p>
              <div className="ag-tabs" role="group" aria-label={copy.difficultyLabel}>
                {ANIME_GUESSR_DIFFICULTY_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={leaderboardDifficultyTier === tier}
                    onClick={() => handleLeaderboardDifficultyTierChange(tier)}
                  >
                    {difficultyLabel(locale, tier)}
                  </button>
                ))}
              </div>
            </div>
            <div className="ag-board">
              <div className="ag-board-head">
                <b>
                  {difficultyLabel(locale, leaderboardDifficultyTier)} ·{" "}
                  {copy.roundsOption(leaderboardRounds)}
                </b>
                <div className="ag-tabs" role="group" aria-label={copy.roundsLabel}>
                  {([5, 10] as const).map((rounds) => (
                    <button
                      key={rounds}
                      type="button"
                      aria-pressed={leaderboardRounds === rounds}
                      onClick={() => setLeaderboardRounds(rounds)}
                    >
                      {copy.roundsOption(rounds)}
                    </button>
                  ))}
                </div>
              </div>
              {leaderboard.length > 0 ? (
                leaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`ag-row ${entry.rank <= 3 ? `is-${entry.rank}` : ""} ${
                      entry.isCurrentUser ? "is-me" : ""
                    }`}
                  >
                    <span className="ag-row-rank">{String(entry.rank).padStart(2, "0")}</span>
                    <span className="ag-user">
                      <span
                        className="ag-avatar"
                        style={{
                          backgroundColor: entry.avatar.color,
                          ...avatarImageStyle(entry.avatarUrl),
                        }}
                        aria-hidden="true"
                      >
                        {entry.avatarUrl ? "" : entry.avatar.icon}
                      </span>
                      <span>
                        {countryCodeToFlagEmoji(entry.countryCode)} {entry.name}
                      </span>
                    </span>
                    <span className="ag-score">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="ag-empty">
                  {leaderboardQuery.isLoading ? copy.rankLoading : copy.rankEmpty}
                </p>
              )}
              {showDetachedCurrentUser && currentUserEntry && (
                <div className="ag-row is-me">
                  <span className="ag-row-rank">
                    {String(currentUserEntry.rank).padStart(2, "0")}
                  </span>
                  <span className="ag-user">
                    <span className="ag-avatar" style={{ background: "#1e2a3a" }} />
                    <span>
                      {copy.myRank}: {currentUserEntry.name}
                    </span>
                  </span>
                  <span className="ag-score">{currentUserEntry.score.toLocaleString()}</span>
                </div>
              )}
              {!session && (
                <Link href={loginUrl} className="ag-row is-me">
                  <span className="ag-row-rank">—</span>
                  <span className="ag-user">
                    <span className="ag-avatar" style={{ background: "#1e2a3a" }} />
                    <span>{copy.rankGuest}</span>
                  </span>
                  <span className="ag-score" style={{ color: "var(--ag-tx3)" }}>
                    {copy.rankLogin}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="ag-contact" id="contact">
        <div className="ag-wrap">
          <div className="ag-sh">
            <div>
              <p className="ag-eyebrow">{copy.contactEyebrow}</p>
              <h2>{copy.contactTitle}</h2>
            </div>
          </div>
          <div className="ag-contact-grid">
            <a className="ag-contact-card" href={`mailto:${CONTACT_GENERAL_EMAIL}`}>
              <h3>{copy.contactGeneralTitle}</h3>
              <p>{copy.contactGeneralHint}</p>
              <b>{CONTACT_GENERAL_EMAIL}</b>
            </a>
            <a className="ag-contact-card" href={`mailto:${CONTACT_SUPPORT_EMAIL}`}>
              <h3>{copy.contactSupportTitle}</h3>
              <p>{copy.contactSupportHint}</p>
              <b>{CONTACT_SUPPORT_EMAIL}</b>
            </a>
          </div>
        </div>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
