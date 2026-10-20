"use client";

import { useState } from "react";
import Link from "next/link";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { useFavoriteAnime } from "~/components/pilgrimage/favorites";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import {
  animeTitle,
  anitabiUrlFromSpotId,
  googleMapsDirectionsUrl,
  loadNavCatalog,
  rankNearbySpots,
  type NavCatalog,
  type NearbySpot,
} from "~/lib/pilgrimage-nav";

type Status =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

export function NearbySpots({ locale }: { locale: AnimeLocale }) {
  const copy = getPilgrimageCopy(locale);
  const { ids } = useFavoriteAnime();
  const [status, setStatus] = useState<Status>("idle");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [catalog, setCatalog] = useState<NavCatalog | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        void loadNavCatalog()
          .then((nextCatalog) => {
            setOrigin(nextOrigin);
            setCatalog(nextCatalog);
            setStatus("ready");
          })
          .catch(() => setStatus("error"));
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  const spots: NearbySpot[] =
    origin && catalog ? rankNearbySpots(catalog.spots, origin, ids) : [];
  const animes = catalog?.animes ?? {};
  const favoriteIds = new Set(ids);
  const favorites = spots.filter((spot) => favoriteIds.has(spot.subjectId));
  const others = spots.filter((spot) => !favoriteIds.has(spot.subjectId));

  return (
    <section className="mb-10" id="near-me" data-testid="near-me">
      <h2 className="mb-2 text-xl font-black text-white">{copy.nearMeTitle}</h2>
      <p className="mb-4 max-w-3xl text-sm leading-6 text-pink-100/70">
        {copy.nearMeHint}
      </p>
      <button
        type="button"
        onClick={locate}
        className="anime-button mb-4 px-4 py-2 text-sm"
        data-testid="near-me-button"
      >
        {status === "locating" ? copy.nearMeLocating : copy.nearMeAction}
      </button>
      {status === "denied" ? (
        <p className="mb-3 text-sm text-pink-100/75">{copy.nearMeDenied}</p>
      ) : null}
      {status === "unavailable" || status === "error" ? (
        <p className="mb-3 text-sm text-pink-100/75">
          {status === "error" ? copy.mapUnavailable : copy.nearMeUnavailable}
        </p>
      ) : null}
      {status === "ready" && spots.length === 0 ? (
        <p className="mb-3 text-sm text-pink-100/75">{copy.nearMeEmpty}</p>
      ) : null}
      {favorites.length > 0 ? (
        <SpotGroup
          locale={locale}
          heading={copy.nearMeFavorites}
          spots={favorites}
          animes={animes}
        />
      ) : null}
      {others.length > 0 ? (
        <SpotGroup
          locale={locale}
          heading={favorites.length > 0 ? copy.nearMeOthers : undefined}
          spots={others}
          animes={animes}
        />
      ) : null}
      <AnitabiCredit
        locale={locale}
        className="mt-3 text-[11px] leading-4 text-pink-100/55"
      />
    </section>
  );
}

function SpotGroup({
  locale,
  heading,
  spots,
  animes,
}: {
  locale: AnimeLocale;
  heading?: string;
  spots: NearbySpot[];
  animes: Parameters<typeof animeTitle>[0];
}) {
  const copy = getPilgrimageCopy(locale);
  return (
    <div className="mb-4">
      {heading ? (
        <h3 className="mb-2 text-xs font-black tracking-[0.16em] text-cyan-100/70 uppercase">
          {heading}
        </h3>
      ) : null}
      <ol className="grid gap-2" data-testid="near-me-list">
        {spots.map((spot) => {
          const href = withAnimeLocale(
            `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
            locale,
          );
          const title = spot.name[locale] || spot.name.en || spot.name.zh;
          return (
            <li
              key={spot.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={href}
                  className="font-bold text-white hover:text-cyan-50"
                >
                  {title}
                </Link>
                <span className="text-xs font-bold text-pink-100/70">
                  {copy.formatDistance(spot.distanceKm)}
                </span>
              </div>
              <p className="mt-1 text-sm text-pink-100/65">
                {animeTitle(animes, spot.subjectId, locale)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={googleMapsDirectionsUrl(spot.lat, spot.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anime-button px-3 py-2 text-xs"
                >
                  {copy.navigate}
                </a>
                <a
                  href={anitabiUrlFromSpotId(spot.id, spot.subjectId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anime-button-secondary px-3 py-2 text-xs"
                >
                  anitabi
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
