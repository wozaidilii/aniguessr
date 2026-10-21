"use client";

import { useEffect, useRef, useState } from "react";
import {
  HOME_BOUNDS_EVENT,
  HOME_FOCUS_WORK_EVENT,
  readHomeFocusWork,
  type HomeBoundsDetail,
  type HomeFocusWorkDetail,
} from "~/components/home/home-events";
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
  localizedSpotName,
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
}: {
  locale: HomeLocale;
  variant: "panel" | "sheet";
}) {
  const copy = getHomePageCopy(locale);
  const distanceLabel = getPilgrimageCopy(locale).formatDistance;
  const limit = variant === "sheet" ? 3 : 12;
  const [open, setOpen] = useState(false);
  const [inView, setInView] = useState(0);
  const [spots, setSpots] = useState<ListedSpot[]>([]);
  const [workHref, setWorkHref] = useState<string | null>(null);
  const focusRef = useRef<HomeFocusWorkDetail>(readHomeFocusWork());

  useEffect(() => {
    let alive = true;
    const bag: {
      bounds?: (event: Event) => void;
      focus?: (event: Event) => void;
    } = {};
    const paint = (catalog: NavCatalog, detail: HomeBoundsDetail) => {
      const focus = focusRef.current;
      const focused = focus.subjectId
        ? catalog.spots.filter((spot) => spot.subjectId === focus.subjectId)
        : catalog.spots.filter(
            (spot) =>
              spot.lng >= detail.west &&
              spot.lng <= detail.east &&
              spot.lat >= detail.south &&
              spot.lat <= detail.north,
          );
      const ranked = focused
        .map((spot) => ({
          spot,
          distanceKm: haversineKm(detail.lat, detail.lng, spot.lat, spot.lng),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      setInView(ranked.length);
      setSpots(
        ranked
          .slice(0, limit)
          .map((item) => toListed(item.spot, locale, catalog, item.distanceKm)),
      );
      setWorkHref(focus.subjectId ? focus.href ?? null : null);
    };
    let latest: HomeBoundsDetail | null = null;
    void loadNavCatalog()
      .then((catalog) => {
        if (!alive) return;
        bag.bounds = (event: Event) => {
          const detail = (event as CustomEvent<HomeBoundsDetail>).detail;
          if (!detail) return;
          latest = detail;
          paint(catalog, detail);
        };
        const onFocus = (event: Event) => {
          const detail = (event as CustomEvent<HomeFocusWorkDetail>).detail;
          focusRef.current = detail ?? { subjectId: null };
          if (latest) paint(catalog, latest);
          else setWorkHref(detail?.subjectId ? detail.href ?? null : null);
        };
        window.addEventListener(HOME_BOUNDS_EVENT, bag.bounds);
        window.addEventListener(HOME_FOCUS_WORK_EVENT, onFocus);
        bag.focus = onFocus;
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (bag.bounds) window.removeEventListener(HOME_BOUNDS_EVENT, bag.bounds);
      if (bag.focus) window.removeEventListener(HOME_FOCUS_WORK_EVENT, bag.focus);
    };
  }, [limit, locale]);

  const title = copy.aroundCount(inView);
  const nearbyHref = withPilgrimageLocale("/", locale);
  const openClass = open ? " is-open" : "";

  return (
    <>
      {variant === "panel" ? (
        <button
          type="button"
          className="home-around"
          data-testid="home-around"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {title}
        </button>
      ) : null}
      <aside
        className={"home-nearby home-nearby-" + variant + openClass}
        aria-label={title}
        aria-hidden={variant === "panel" ? !open : undefined}
        inert={variant === "panel" && !open ? true : undefined}
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
        <div className="home-nearby-head">
          <p className="home-nearby-label">{title}</p>
          {workHref ? (
            <a className="home-work-page" href={workHref}>
              {copy.workPage}
            </a>
          ) : null}
          {variant === "panel" ? (
            <button
              type="button"
              className="home-drawer-close"
              aria-label={copy.closeMenu}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          ) : null}
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
                    <span>
                      {copy.walkMinutes(walkMinutes(spot.distanceKm))}
                    </span>
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
        {variant === "sheet" ? (
          <div className="home-sheet-extra">
            <div className="home-sheet-pills">
              <a href={withPilgrimageLocale("/pilgrimage/anime", locale)}>
                {copy.searchPill}
              </a>
              <a href={withPilgrimageLocale("/", locale)}>
                {copy.favoritesPill}
              </a>
            </div>
            <a
              className="home-btn home-btn-primary home-btn-block"
              data-find-nearby=""
              href={nearbyHref}
            >
              <LocateIcon />
              {copy.primaryCta}
            </a>
            <p className="home-privacy">
              <ShieldIcon />
              <span>{copy.privacy}</span>
            </p>
          </div>
        ) : (
          <p className="home-privacy">
            <ShieldIcon />
            <span>{copy.privacy}</span>
          </p>
        )}
      </aside>
    </>
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
    name: localizedSpotName(spot, locale),
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
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      <path
        d="M5 19L19 5M19 5H9M19 5v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <path
        d="M12 8v6M8 22l4-8 4 8M7 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
