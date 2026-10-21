"use client";

import { useEffect, useState } from "react";
import { HOME_COPY } from "~/lib/aniguessr-copy";
import { withAnimeLocale } from "~/lib/anime-locale";
import { COUNTRY_OPTIONS, countryCodeToFlagEmoji } from "~/lib/country";
import { getHomePageCopy } from "~/lib/home-page-copy";
import { homeSiteLocale, type HomeLocale } from "~/lib/home-locale";
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
import type { PlayerSession } from "~/types/player";
import { api } from "~/trpc/react";

export function HomeAccount({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const siteLocale = homeSiteLocale(locale);
  const profileCopy = HOME_COPY[siteLocale];
  const loginHref = withAnimeLocale("/login", siteLocale);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = getStoredPlayerSession();
    setSession(stored);
    if (stored) identifyPostHogUser(stored.user);
    setName(stored?.user.name ?? "");
    setCountry(stored?.user.countryCode ?? "");
  }, []);

  const updateProfile = api.player.updateProfile.useMutation({
    onSuccess(user) {
      if (!session) return;
      const next = { token: session.token, user };
      savePlayerSession(next);
      identifyPostHogUser(user);
      setSession(next);
      setName(user.name);
      setCountry(user.countryCode ?? "");
      setMessage(profileCopy.saved);
      capturePostHogEvent(
        POSTHOG_EVENTS.profileUpdated,
        { has_country: Boolean(user.countryCode) },
        user.id,
      );
    },
  });

  if (!session) {
    return (
      <a className="home-login" href={loginHref}>
        {copy.login}
      </a>
    );
  }

  return (
    <div className="home-account">
      <button
        type="button"
        className="home-avatar-btn"
        aria-expanded={open}
        aria-label={profileCopy.profileTitle}
        onClick={() => setOpen((value) => !value)}
        style={{ backgroundColor: session.user.avatar.color }}
      >
        {session.user.avatar.icon}
      </button>
      {open ? (
        <section className="ag-profile">
          <h2>{profileCopy.profileTitle}</h2>
          <label>
            {profileCopy.username}
            <input
              value={name}
              maxLength={12}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="home-flags" role="radiogroup" aria-label={profileCopy.country}>
            <button
              type="button"
              role="radio"
              aria-checked={country === ""}
              aria-label={profileCopy.countryUnset}
              onClick={() => setCountry("")}
            >
              {countryCodeToFlagEmoji(null)}
            </button>
            {COUNTRY_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={country === option.code}
                aria-label={option.label}
                onClick={() => setCountry(option.code)}
              >
                {countryCodeToFlagEmoji(option.code)}
              </button>
            ))}
          </div>
          <div className="home-account-actions">
            <button
              type="button"
              className="home-btn home-btn-primary"
              disabled={updateProfile.isPending || name.trim().length === 0}
              onClick={() => {
                setMessage("");
                updateProfile.mutate({
                  token: session.token,
                  name,
                  avatar: session.user.avatar,
                  countryCode: country || null,
                });
              }}
            >
              {updateProfile.isPending ? profileCopy.saving : profileCopy.saveProfile}
            </button>
            <button
              type="button"
              className="home-btn home-btn-secondary"
              onClick={() => {
                clearPlayerSession();
                resetPostHogUser();
                setSession(null);
                setOpen(false);
              }}
            >
              {copy.logout}
            </button>
          </div>
          {message ? <p>{message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
