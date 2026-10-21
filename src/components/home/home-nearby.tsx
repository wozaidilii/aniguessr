"use client";

import { useEffect, useRef, useState } from "react";
import {
  HOME_BOUNDS_EVENT,
  HOME_ORIGIN_EVENT,
  type HomeBoundsDetail,
  type HomeOriginDetail,
} from "~/components/home/home-events";
import type { HomeNearbySeed } from "~/lib/home-catalog";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  animeTitle,
  googleMapsDirectionsUrl,
  googleStreetViewUrl,
  haversineKm,
  loadNavCatalog,
  localizedNavText,
  type NavCatalog,
  type NavSpot,
} from "~/lib/pilgrimage-nav";

interface ListedSpot {
  id: string;
  name: string;
  anime: string;
  lat: number;
  lng: number;
  href: string;
  distanceKm?: number;
}

export function HomeNearby({
  locale,
  variant,
  seeds,
  popularLocationSlugs,
}: {
  locale: HomeLocale;
  variant: "panel" | "sheet";
  seeds: HomeNearbySeed[];
  popularLocationSlugs: string[];
}) {
  const copy = getHomePageCopy(locale);
  const distanceLabel = getPilgrimageCopy(locale).formatDistance;
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<HomeOriginDetail | null>(null);
  const [spots, setSpots] = useState<ListedSpot[]>(seeds);
  const originRef = useRef<HomeOriginDetail | null>(null);
  const catalogRef = useRef<NavCatalog | null>(null);
  const popular = useRef(new Set(popularLocationSlugs));
  popular.current = new Set(popularLocationSlugs);

  useEffect(() => {
    let alive = true;
    const bag: { bounds?: (event: Event) => void } = {};
    const showOrigin = (detail: HomeOriginDetail, catalog: NavCatalog) => {
      const ranked = [...catalog.spots]
        .map((spot) => ({
          spot,
          distanceKm: haversineKm(detail.lat, detail.lng, spot.lat, spot.lng),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 8)
        .map((item) => toListed(item.spot, locale, catalog, item.distanceKm));
      setSpots(ranked);
    };
    const onOrigin = (event: Event) => {
      const detail = (event as CustomEvent<HomeOriginDetail>).detail;
      originRef.current = detail;
      setOrigin(detail);
      if (catalogRef.current) showOrigin(detail, catalogRef.current);
    };
    window.addEventListener(HOME_ORIGIN_EVENT, onOrigin);
    void loadNavCatalog()
      .then((catalog) => {
        if (!alive) return;
        catalogRef.current = catalog;
        bag.bounds = (event: Event) => {
          if (originRef.current) return;
          const detail = (event as CustomEvent<HomeBoundsDetail>).detail;
          const inside = catalog.spots.filter(
            (spot) =>
              spot.lng >= detail.west &&
              spot.lng <= detail.east &&
              spot.lat >= detail.south &&
              spot.lat <= detail.north,
          );
          inside.sort((a, b) => {
            const area =
              Number(popular.current.has(b.locationSlug)) -
              Number(popular.current.has(a.locationSlug));
            if (area !== 0) return area;
            return (
              haversineKm(detail.lat, detail.lng, a.lat, a.lng) -
              haversineKm(detail.lat, detail.lng, b.lat, b.lng)
            );
          });
          const next = inside
            .slice(0, 8)
            .map((spot) => toListed(spot, locale, catalog));
          if (next.length > 0) setSpots(next);
        };
        window.addEventListener(HOME_BOUNDS_EVENT, bag.bounds);
        if (originRef.current) showOrigin(originRef.current, catalog);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      window.removeEventListener(HOME_ORIGIN_EVENT, onOrigin);
      if (bag.bounds) window.removeEventListener(HOME_BOUNDS_EVENT, bag.bounds);
    };
  }, [locale]);

  const title = origin ? copy.nearbyTitle : copy.drawerTitle;
  const nearbyHref = withPilgrimageLocale("/pilgrimage#nearby", locale);

  return (
    <aside
      className={`home-nearby home-nearby-${variant}${open ? " is-open" : ""}`}
      aria-label={title}
    >
      {variant === "sheet" ? (
        <button
          type="button"
          className="home-grab"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
        </button>
      ) : null}
      {variant === "sheet" ? (
        <>
          <div className="home-sheet-pills">
            <a href={withPilgrimageLocale("/pilgrimage/anime", locale)}>
              {copy.searchPill}
            </a>
            <a href={withPilgrimageLocale("/pilgrimage#favorites", locale)}>
              {copy.favoritesPill}
            </a>
          </div>
          <a className="home-btn home-btn-primary home-btn-block" data-find-nearby="" href={nearbyHref}>
            <LocateIcon />
            {copy.primaryCta}
          </a>
          <p className="home-privacy">
            <ShieldIcon />
            <span>{copy.privacy}</span>
          </p>
        </>
      ) : null}
      <div className="home-nearby-head">
        <p className="home-nearby-label">{title}</p>
        {origin ? <p>{copy.nearbySorted}</p> : null}
      </div>
      <ol className="home-spot-list">
        {spots.map((spot, index) => (
          <li key={spot.id}>
            <div className="home-spot-top">
              <span className="home-spot-n">{index + 1}</span>
              <div>
                <a href={spot.href}>{spot.name}</a>
                {spot.anime ? <p>{spot.anime}</p> : null}
              </div>
              {spot.distanceKm != null ? (
                <span className="home-spot-dist">
                  <b>{distanceLabel(spot.distanceKm)}</b>
                  <span>{copy.walkMinutes(walkMinutes(spot.distanceKm))}</span>
                </span>
              ) : null}
            </div>
            <div className="home-spot-actions">
              <a
                href={googleMapsDirectionsUrl(spot.lat, spot.lng)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.navigate}
              >
                <NavIcon />
                {copy.navigate}
              </a>
              <a
                href={googleStreetViewUrl(spot.lat, spot.lng)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.streetView}
              >
                <PersonIcon />
                {copy.streetView}
              </a>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function toListed(
  spot: NavSpot,
  locale: HomeLocale,
  catalog: NavCatalog,
  distanceKm?: number,
): ListedSpot {
  return {
    id: spot.id,
    name: localizedNavText(spot.name, locale),
    anime: animeTitle(catalog.animes, spot.subjectId, locale),
    lat: spot.lat,
    lng: spot.lng,
    href: withPilgrimageLocale(
      `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
      locale,
    ),
    distanceKm,
  };
}

function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km * 1000) / 80));
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19L19 5M19 5H9M19 5v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <path d="M12 8v6M8 22l4-8 4 8M7 12h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

