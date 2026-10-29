"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadNavCatalog,
  localizedNavText,
  localizedSpotName,
  type NavCatalog,
} from "~/lib/pilgrimage-nav";
import { readFavoriteAnimeIds } from "~/lib/pilgrimage-favorites";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { TRAVEL_HUBS, TRAVEL_PLACES, TRIP_PRESETS } from "~/lib/travel/catalog";
import { getTravelCopy } from "~/lib/travel/copy";
import { buildTripPlan } from "~/lib/travel/engine";
import { exportTripText } from "~/lib/travel/export";
import {
  emptyTrip,
  MAX_TRIP_STOPS,
  parseTrip,
  tripFromHash,
  tripShareUrl,
  tripStateSchema,
  TRIP_STORAGE_KEY,
} from "~/lib/travel/state";
import type {
  KlookLinks,
  TripState,
  TripStop,
  TravelInterest,
  TravelMode,
  TravelPace,
} from "~/lib/travel/types";
import { PlannerSearch } from "./planner-search";
import { PlannerItinerary } from "./planner-itinerary";
import { PlannerRecommendations } from "./planner-recommendations";

const PlannerMap = dynamic(
  () => import("./planner-map").then((module) => module.PlannerMap),
  {
    ssr: false,
    loading: () => (
      <div className="trip-map-loading" aria-busy="true">
        …
      </div>
    ),
  },
);

export function TravelPlanner({
  locale,
  klookLinks,
}: {
  locale: PilgrimageLocale;
  klookLinks: KlookLinks;
}) {
  const copy = getTravelCopy(locale);
  const [catalog, setCatalog] = useState<NavCatalog | null>(null);
  const [state, setState] = useState<TripState>(emptyTrip);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const [initialized, setInitialized] = useState(false);
  const canPersist = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;
    setError(false);
    void loadNavCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!catalog || initializedRef.current) return;
    initializedRef.current = true;
    const hydrate = () => {
      if (window.location.hash.startsWith("#trip=")) {
        const shared = tripFromHash(window.location.hash);
        if (shared) {
          setState(shared);
          canPersist.current = true;
        } else {
          setStatus(copy.invalid);
          canPersist.current = false;
        }
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const anime = params.get("anime");
      const spot = params.get("spot");
      const area = params.get("area");
      if (anime || spot || area) {
        const next = emptyTrip();
        if (anime) next.animeIds = [anime];
        if (spot) next.spotIds = [spot];
        if (area) {
          const first = catalog.spots.find(
            (item) => item.locationSlug === area,
          );
          if (first) {
            next.mode = "route";
            next.routeIds = [`spot:${first.id}`];
          } else setStatus(copy.unknown);
        }
        const parsed = tripStateSchema.safeParse(next);
        if (parsed.success) {
          setState(parsed.data);
          canPersist.current = true;
        } else setStatus(copy.invalid);
        return;
      }
      try {
        const raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
        if (raw) {
          const saved = parseTrip(raw);
          if (saved) {
            setState(saved);
            setStatus(copy.restored);
            canPersist.current = true;
          } else setStatus(copy.invalid);
        } else canPersist.current = true;
      } catch {
        setStatus(copy.storageError);
      }
    };
    hydrate();
    setInitialized(true);
    const onHashChange = () => {
      if (!window.location.hash.startsWith("#trip=")) return;
      const shared = tripFromHash(window.location.hash);
      if (shared) {
        canPersist.current = true;
        setState(shared);
        setStatus("");
      } else {
        canPersist.current = false;
        setStatus(copy.invalid);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [catalog, copy]);

  useEffect(() => {
    if (!initialized || !canPersist.current) return;
    try {
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStatus(copy.storageError);
    }
  }, [state, initialized, copy]);

  function update(next: TripState) {
    const checked = tripStateSchema.safeParse(next);
    if (!checked.success) {
      setStatus(copy.limit);
      return;
    }
    canPersist.current = true;
    setState(checked.data);
    setStatus("");
    setShareFallback("");
    // A stale shared fragment must not override a newly edited draft on reload.
    if (window.location.hash.startsWith("#trip=") || window.location.search)
      window.history.replaceState(null, "", window.location.pathname);
  }
  function patch(value: Partial<TripState>) {
    update({ ...state, ...value });
  }
  const plan = useMemo(
    () => (catalog ? buildTripPlan(catalog, state) : null),
    [catalog, state],
  );
  const dayById = useMemo(
    () =>
      Object.fromEntries(
        plan?.days.flatMap((day) =>
          day.stops.map(({ stop }) => [stop.id, day.day]),
        ) ?? [],
      ),
    [plan],
  );
  const nameById = useMemo(() => {
    const names = new Map<string, string>();
    catalog?.spots.forEach((spot) =>
      names.set(`spot:${spot.id}`, localizedSpotName(spot, locale)),
    );
    [...TRAVEL_HUBS, ...TRAVEL_PLACES].forEach((place) =>
      names.set(
        `${place.kind === "hub" ? "hub" : "place"}:${place.id}`,
        localizedNavText(place.name, locale),
      ),
    );
    return names;
  }, [catalog, locale]);

  function select(kind: "anime" | "spot" | "hub" | "place", id: string) {
    if (kind === "anime") {
      if (!state.animeIds.includes(id))
        patch({ animeIds: [...state.animeIds, id], stopOrder: [] });
      return;
    }
    const key = `${kind}:${id}`;
    if (kind === "hub" || state.mode === "route") {
      if (!state.routeIds.includes(key))
        patch({
          routeIds: [...state.routeIds, key],
          excludedIds: state.excludedIds.filter((item) => item !== key),
          stopOrder: [],
        });
    } else if (kind === "spot")
      patch({
        spotIds: [...new Set([...state.spotIds, id])],
        excludedIds: state.excludedIds.filter((item) => item !== key),
      });
    else
      patch({
        placeIds: [...new Set([...state.placeIds, id])],
        excludedIds: state.excludedIds.filter((item) => item !== key),
      });
  }
  function addDiscovery(stop: TripStop) {
    if (state.spotIds.length + state.placeIds.length >= MAX_TRIP_STOPS) {
      setStatus(copy.limit);
      return;
    }
    patch({
      ...(stop.spotId
        ? { spotIds: [...new Set([...state.spotIds, stop.spotId])] }
        : {
            placeIds: [
              ...new Set([...state.placeIds, stop.id.replace(/^place:/, "")]),
            ],
          }),
      excludedIds: state.excludedIds.filter((item) => item !== stop.id),
    });
  }
  function remove(id: string) {
    patch({
      routeIds: state.routeIds.filter((item) => item !== id),
      spotIds: state.spotIds.filter((item) => `spot:${item}` !== id),
      placeIds: state.placeIds.filter((item) => `place:${item}` !== id),
      excludedIds: [...new Set([...state.excludedIds, id])],
      stopOrder: state.stopOrder.filter((item) => item !== id),
    });
  }
  function move(id: string, delta: number, anchors = false) {
    const ids = anchors
      ? [...state.routeIds]
      : (plan?.ordered.map((stop) => stop.id) ?? []);
    const index = ids.indexOf(id);
    if (index < 0 || index + delta < 0 || index + delta >= ids.length) return;
    [ids[index], ids[index + delta]] = [ids[index + delta]!, ids[index]!];
    patch(anchors ? { routeIds: ids, stopOrder: [] } : { stopOrder: ids });
  }
  function useFavorites() {
    const favorites = readFavoriteAnimeIds().filter(
      (id) => catalog?.animes[id],
    );
    if (!favorites.length) {
      setStatus(copy.noFavorites);
      return;
    }
    const ids = [...new Set([...state.animeIds, ...favorites])];
    patch({ animeIds: ids.slice(0, 8), stopOrder: [] });
    if (ids.length > 8) setStatus(copy.limit);
  }
  function save() {
    try {
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(state));
      canPersist.current = true;
      setStatus(copy.saved);
    } catch {
      setStatus(copy.storageError);
    }
  }
  async function share() {
    const url = tripShareUrl(window.location.origin, locale, state);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(copy.shared);
    } catch {
      setStatus(copy.shareError);
      setShareFallback(url);
    }
  }
  function download() {
    if (!plan || !catalog) return;
    const text = `${exportTripText(plan, state, catalog, locale)}\n\n${tripShareUrl(window.location.origin, locale, state)}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aniguessr-trip-${state.startDate || "plan"}.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const explicit = [
    ...state.spotIds.map((id) => `spot:${id}`),
    ...state.placeIds.map((id) => `place:${id}`),
  ].filter((id) => !state.routeIds.includes(id));

  return (
    <main className="trip-page" data-locale={locale}>
      <header className="trip-hero">
        <div>
          <p className="trip-eyebrow">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="trip-intro">{copy.description}</p>
        </div>
        <div className="trip-hero-art" aria-hidden="true">
          <svg viewBox="0 0 280 170">
            <path
              d="M15 115Q70 10 125 78T260 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 7"
            />
            <circle cx="42" cy="78" r="8" />
            <circle cx="142" cy="85" r="8" />
            <circle cx="247" cy="42" r="8" />
            <path
              d="M72 144l28-43 27 43zm83-3 39-59 40 59z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>SCENE → JOURNEY</span>
        </div>
      </header>
      <div className="trip-workspace">
        <aside className="trip-controls trip-no-print">
          <section className="trip-panel">
            <div className="trip-segment trip-mode">
              <button
                type="button"
                aria-pressed={state.mode === "anime"}
                onClick={() => patch({ mode: "anime", stopOrder: [] })}
              >
                {copy.animeMode}
              </button>
              <button
                type="button"
                aria-pressed={state.mode === "route"}
                onClick={() => patch({ mode: "route", stopOrder: [] })}
              >
                {copy.routeMode}
              </button>
            </div>
            <p className="trip-muted">
              {state.mode === "anime" ? copy.animeHelp : copy.routeHelp}
            </p>
            {catalog && initialized ? (
              <PlannerSearch
                catalog={catalog}
                state={state}
                locale={locale}
                onSelect={select}
              />
            ) : (
              <div className="trip-loading" role="status">
                {error ? (
                  <>
                    <p>{copy.loadError}</p>
                    <button
                      type="button"
                      className="trip-button"
                      onClick={() => setAttempt((value) => value + 1)}
                    >
                      {copy.retry}
                    </button>
                  </>
                ) : (
                  copy.loading
                )}
              </div>
            )}
            <button
              type="button"
              className="trip-text-button"
              disabled={!initialized}
              onClick={useFavorites}
            >
              ♡ {copy.favorites}
            </button>
            {state.animeIds.length > 0 && (
              <div className="trip-selected">
                <span className="trip-label">{copy.selected}</span>
                <div className="trip-chips">
                  {state.animeIds.map((id) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() =>
                        patch({
                          animeIds: state.animeIds.filter(
                            (item) => item !== id,
                          ),
                          stopOrder: [],
                        })
                      }
                      aria-label={`${copy.remove} ${catalog?.animes[id] ? localizedNavText(catalog.animes[id], locale) : id}`}
                    >
                      {catalog?.animes[id]
                        ? localizedNavText(catalog.animes[id], locale)
                        : id}{" "}
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {explicit.length > 0 && (
              <div className="trip-chips">
                {explicit.map((id) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => remove(id)}
                    aria-label={`${copy.remove} ${nameById.get(id) ?? id}`}
                  >
                    {nameById.get(id) ?? id} <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
            {(state.mode === "route" || state.routeIds.length > 0) && (
              <div className="trip-anchors">
                <h3>{copy.routeAnchors}</h3>
                {state.routeIds.length < 2 && (
                  <p className="trip-muted">{copy.routeNeeds}</p>
                )}
                <ol>
                  {state.routeIds.map((id, index) => (
                    <li key={id}>
                      <b>{index + 1}</b>
                      <span>{nameById.get(id) ?? id}</span>
                      <div className="trip-stop-actions">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(id, -1, true)}
                          aria-label={`${copy.up} ${nameById.get(id) ?? id}`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === state.routeIds.length - 1}
                          onClick={() => move(id, 1, true)}
                          aria-label={`${copy.down} ${nameById.get(id) ?? id}`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          aria-label={`${copy.remove} ${nameById.get(id) ?? id}`}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
          <section className="trip-panel">
            <h2>{copy.settings}</h2>
            <div className="trip-fields">
              <label>
                {copy.days}
                <select
                  value={state.days}
                  onChange={(event) =>
                    patch({ days: Number(event.target.value) })
                  }
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.pace}
                <select
                  value={state.pace}
                  onChange={(event) =>
                    patch({ pace: event.target.value as TravelPace })
                  }
                >
                  {(["relaxed", "balanced", "full"] as const).map((value) => (
                    <option value={value} key={value}>
                      {copy[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.transport}
                <select
                  value={state.transport}
                  onChange={(event) =>
                    patch({ transport: event.target.value as TravelMode })
                  }
                >
                  {(["transit", "walking", "driving"] as const).map((value) => (
                    <option value={value} key={value}>
                      {copy[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.date}
                <input
                  type="date"
                  min="2000-01-01"
                  max="2099-12-31"
                  value={state.startDate}
                  onChange={(event) => patch({ startDate: event.target.value })}
                />
              </label>
            </div>
            <label className="trip-radius">
              {copy.radius}
              <strong>{state.radiusKm} km</strong>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={state.radiusKm}
                onChange={(event) =>
                  patch({ radiusKm: Number(event.target.value) })
                }
              />
            </label>
            <fieldset className="trip-interests">
              <legend>{copy.interests}</legend>
              {(["sightseeing", "food", "onsen"] as TravelInterest[]).map(
                (interest) => (
                  <label key={interest}>
                    <input
                      type="checkbox"
                      checked={state.interests.includes(interest)}
                      onChange={() =>
                        patch({
                          interests: state.interests.includes(interest)
                            ? state.interests.filter(
                                (item) => item !== interest,
                              )
                            : [...state.interests, interest],
                        })
                      }
                    />
                    {copy[interest]}
                  </label>
                ),
              )}
            </fieldset>
            <div className="trip-edit-tools">
              <button
                type="button"
                className="trip-text-button"
                onClick={() => update(emptyTrip())}
              >
                {copy.clear}
              </button>
              {state.excludedIds.length > 0 && (
                <button
                  type="button"
                  className="trip-text-button"
                  onClick={() => patch({ excludedIds: [] })}
                >
                  {copy.restore}
                </button>
              )}
            </div>
          </section>
          <p className="trip-local-note">{copy.autoSave}</p>
        </aside>
        <div className="trip-results" id="trip-results">
          <div className="trip-status" role="status" aria-live="polite">
            {status}
          </div>
          {shareFallback && (
            <textarea
              className="trip-share-fallback"
              aria-label={copy.share}
              value={shareFallback}
              readOnly
              onFocus={(event) => event.target.select()}
            />
          )}
          {plan && catalog && plan.ordered.length > 0 ? (
            <>
              <section className="trip-panel trip-summary">
                <div className="trip-summary-top">
                  <div>
                    <p className="trip-eyebrow">{copy.itinerary}</p>
                    <h2>
                      {state.days} {copy.dayUnit}
                      <span>
                        {" "}
                        / {plan.ordered.length} {copy.stops}
                      </span>
                    </h2>
                  </div>
                  <div className="trip-toolbar trip-no-print">
                    <button
                      type="button"
                      className="trip-button"
                      onClick={save}
                    >
                      {copy.save}
                    </button>
                    <button
                      type="button"
                      className="trip-button trip-primary"
                      onClick={share}
                    >
                      {copy.share} ↗
                    </button>
                    <button
                      type="button"
                      className="trip-text-button"
                      onClick={download}
                    >
                      {copy.export}
                    </button>
                    <button
                      type="button"
                      className="trip-text-button"
                      onClick={() => window.print()}
                    >
                      {copy.print}
                    </button>
                  </div>
                </div>
                <div className="trip-no-print">
                  <PlannerMap
                    stops={plan.ordered}
                    dayById={dayById}
                    locale={locale}
                  />
                  <p className="trip-map-note">{copy.mapNote}</p>
                </div>
                <p className="trip-disclaimer">{copy.disclaimer}</p>
              </section>
              <div className="trip-order-tools trip-no-print">
                <p>{copy.orderHelp}</p>
                {state.stopOrder.length > 0 && (
                  <button
                    type="button"
                    className="trip-text-button"
                    onClick={() => patch({ stopOrder: [] })}
                  >
                    {copy.resetOrder}
                  </button>
                )}
              </div>
              <PlannerItinerary
                plan={plan}
                state={state}
                catalog={catalog}
                locale={locale}
                onRemove={remove}
                onMove={move}
                onDuration={(id, minutes) =>
                  patch({
                    visitMinutes: { ...state.visitMinutes, [id]: minutes },
                  })
                }
              />
              <PlannerRecommendations
                plan={plan}
                catalog={catalog}
                locale={locale}
                klookLinks={klookLinks}
                onAdd={addDiscovery}
              />
            </>
          ) : (
            <div className="trip-empty trip-no-print">
              <div className="trip-empty-symbol" aria-hidden="true">
                ↗
              </div>
              <h2>{copy.empty}</h2>
              <p>{copy.emptyHelp}</p>
              {plan && plan.unknownIds.length > 0 && (
                <p className="trip-notice">{copy.unknown}</p>
              )}
            </div>
          )}
          <section className="trip-starters trip-no-print">
            <p className="trip-eyebrow">TRAVEL NOTES</p>
            <h2>{copy.starters}</h2>
            <p className="trip-muted">{copy.startersHelp}</p>
            <div className="trip-preset-grid">
              {TRIP_PRESETS.map((preset, index) => (
                <button
                  type="button"
                  className={`trip-preset trip-preset-${index}`}
                  key={preset.id}
                  disabled={!initialized}
                  onClick={() =>
                    update({
                      ...emptyTrip(),
                      mode: "route",
                      routeIds: [...preset.routeIds],
                      days: preset.days,
                      radiusKm: preset.radiusKm,
                    })
                  }
                >
                  <span className="trip-preset-index">
                    0{index + 1}{" "}
                    <span>
                      {preset.days} {copy.dayUnit}
                    </span>
                  </span>
                  <strong>{localizedNavText(preset.title, locale)}</strong>
                  <small>{localizedNavText(preset.description, locale)}</small>
                  <span className="trip-preset-link">{copy.useRoute} ↗</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      {plan && plan.ordered.length > 0 && (
        <button
          type="button"
          className="trip-mobile-jump trip-no-print"
          onClick={() =>
            document
              .getElementById("trip-results")
              ?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
                block: "start",
              })
          }
        >
          {copy.itinerary} · {plan.ordered.length} {copy.stops} ↑
        </button>
      )}
    </main>
  );
}
