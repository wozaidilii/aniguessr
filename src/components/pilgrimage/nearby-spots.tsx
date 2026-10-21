"use client";

import { useState } from "react";
import Link from "next/link";
import { useFavoriteAnime } from "~/components/pilgrimage/favorites";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  type PilgrimageLocale,
  withPilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import {
  clusterSamePlaces,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  groupPlaceWorks,
  haversineKm,
  loadNavCatalog,
  localizedSpotName,
  type NavCatalog,
  type NavSpot,
  type NearbySpot,
} from "~/lib/pilgrimage-nav";

type Status =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

export function NearbySpots({ locale }: { locale: PilgrimageLocale }) {
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

  const groups =
    origin && catalog
      ? nearbyPlaceGroups(catalog.spots, origin, ids)
      : emptyGroups;
  const animes = catalog?.animes ?? {};
  const favorites = groups.favorites;
  const others = groups.others;

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
      {status === "ready" && favorites.length + others.length === 0 ? (
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
    </section>
  );
}

const emptyGroups = { favorites: [], others: [] } as {
  favorites: NearbySpot[][];
  others: NearbySpot[][];
};

function nearbyPlaceGroups(
  spots: readonly NavSpot[],
  origin: { lat: number; lng: number },
  favoriteIds: readonly string[],
): { favorites: NearbySpot[][]; others: NearbySpot[][] } {
  const favorite = new Set(favoriteIds);
  const ranked: NearbySpot[] = spots
    .map((spot) => ({
      ...spot,
      distanceKm: haversineKm(origin.lat, origin.lng, spot.lat, spot.lng),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
  const favorites: NearbySpot[][] = [];
  const others: NearbySpot[][] = [];
  for (const group of clusterSamePlaces(ranked)) {
    const favored = group.some((spot) => favorite.has(spot.subjectId));
    if (favored) {
      if (favorites.length < 20) favorites.push(group);
    } else if (others.length < 20) {
      others.push(group);
    }
  }
  return { favorites, others };
}

function SpotGroup({
  locale,
  heading,
  spots,
  animes,
}: {
  locale: PilgrimageLocale;
  heading?: string;
  spots: NearbySpot[][];
  animes: NavCatalog["animes"];
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
        {spots.map((group) => {
          const spot = group[0];
          if (!spot) return null;
          const title = localizedSpotName(spot, locale);
          return (
            <li
              key={spot.id}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                {group.length === 1 ? (
                  <Link
                    href={withPilgrimageLocale(
                      `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
                      locale,
                    )}
                    className="font-bold text-white hover:text-cyan-50"
                  >
                    {title}
                  </Link>
                ) : (
                  <span className="font-bold text-white">{title}</span>
                )}
                <span className="text-xs font-bold text-pink-100/70">
                  {copy.formatDistance(spot.distanceKm)}
                </span>
              </div>
              {group.length === 1 ? (
                <p className="mt-1 text-sm text-pink-100/65">
                  {groupPlaceWorks(group, animes, locale, (id) =>
                    withPilgrimageLocale(
                      `/pilgrimage/spots/${encodeSpotId(id)}`,
                      locale,
                    ),
                  )[0]?.title ?? ""}
                </p>
              ) : (
                <ul className="mt-1 grid gap-1 text-sm text-pink-100/65">
                  {groupPlaceWorks(group, animes, locale, (id) =>
                    withPilgrimageLocale(
                      `/pilgrimage/spots/${encodeSpotId(id)}`,
                      locale,
                    ),
                  ).map((work) => (
                    <li key={work.key}>
                      {work.spots.length === 1 && work.spots[0] ? (
                        <a
                          href={work.spots[0].href}
                          className="hover:text-cyan-50"
                        >
                          {work.title}
                        </a>
                      ) : (
                        <>
                          <span>
                            {work.title}
                            {work.countLabel}
                          </span>
                          <ul className="mt-0.5 grid gap-0.5 pl-3 text-xs">
                            {work.spots.map((item) => (
                              <li key={item.id}>
                                <a
                                  href={item.href}
                                  className="hover:text-cyan-50"
                                >
                                  {item.place}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
                  href={googleStreetViewUrl(spot.lat, spot.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anime-button-secondary px-3 py-2 text-xs"
                >
                  {copy.streetView}
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
