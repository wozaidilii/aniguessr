"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  matchPreparedAnimeTitles,
  prepareAnimeSearch,
} from "~/lib/anime-title-search";
import {
  localizedNavText,
  localizedSpotName,
  type NavCatalog,
} from "~/lib/pilgrimage-nav";
import { POPULAR_ANIME_SUBJECT_IDS } from "~/lib/popular-anime";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { TRAVEL_HUBS, TRAVEL_PLACES } from "~/lib/travel/catalog";
import { getTravelCopy } from "~/lib/travel/copy";
import type { TripState } from "~/lib/travel/types";

type Result = {
  subjectId: string;
  titles: { zh?: string; tw?: string; ja?: string; en?: string };
  aliases?: string[];
  kind: "anime" | "spot" | "hub" | "place";
  id: string;
  subtitle?: string;
};
export function PlannerSearch({
  catalog,
  locale,
  state,
  onSelect,
}: {
  catalog: NavCatalog;
  locale: PilgrimageLocale;
  state: TripState;
  onSelect: (kind: Result["kind"], id: string) => void;
}) {
  const copy = getTravelCopy(locale);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [filter, setFilter] = useState<"anime" | "places">("anime");
  const records = useMemo(() => {
    const anime: Result[] = Object.entries(catalog.animes).map(
      ([id, titles]) => ({ subjectId: id, titles, kind: "anime", id }),
    );
    const places: Result[] = [
      ...[...TRAVEL_HUBS, ...TRAVEL_PLACES].map(
        (place): Result => ({
          subjectId: place.id,
          titles: place.name,
          kind: place.kind === "hub" ? "hub" : "place",
          id: place.id,
          subtitle: copy[place.kind],
        }),
      ),
      ...catalog.spots.map(
        (spot): Result => ({
          subjectId: spot.subjectId,
          titles: {
            ...spot.name,
            [locale === "zh-tw" ? "tw" : locale]: localizedSpotName(
              spot,
              locale,
            ),
          },
          aliases: [
            spot.locationSlug,
            ...Object.values(
              catalog.animes[spot.subjectId] ?? spot.name,
            ).filter((value): value is string => typeof value === "string"),
          ],
          kind: "spot",
          id: spot.id,
          subtitle: localizedNavText(
            catalog.animes[spot.subjectId] ?? spot.name,
            locale,
          ),
        }),
      ),
    ];
    return {
      anime,
      places,
      preparedAnime: prepareAnimeSearch(anime),
      preparedPlaces: prepareAnimeSearch(places),
    };
  }, [catalog, locale, copy]);
  const results = useMemo(() => {
    if (deferred.trim())
      return matchPreparedAnimeTitles(
        filter === "anime" ? records.preparedAnime : records.preparedPlaces,
        deferred,
        24,
      );
    if (filter === "places") return records.places.slice(0, TRAVEL_HUBS.length);
    return POPULAR_ANIME_SUBJECT_IDS.flatMap((id) =>
      records.anime.filter((item) => item.id === id),
    );
  }, [deferred, filter, records]);
  function selected(item: Result) {
    return item.kind === "anime"
      ? state.animeIds.includes(item.id)
      : state.routeIds.includes(`${item.kind}:${item.id}`) ||
          (item.kind === "spot"
            ? state.spotIds.includes(item.id)
            : state.placeIds.includes(item.id));
  }
  return (
    <section className="trip-search" aria-label={copy.search}>
      <label htmlFor="trip-search" className="trip-label">
        {copy.search}
      </label>
      <div className="trip-search-field">
        <span aria-hidden="true">⌕</span>
        <input
          id="trip-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
        />
      </div>
      <div className="trip-segment trip-search-tabs">
        <button
          type="button"
          aria-pressed={filter === "anime"}
          onClick={() => setFilter("anime")}
        >
          {copy.searchAnime}
        </button>
        <button
          type="button"
          aria-pressed={filter === "places"}
          onClick={() => setFilter("places")}
        >
          {copy.searchPlaces}
        </button>
      </div>
      <ul
        className="trip-search-results"
        aria-label={filter === "anime" ? copy.searchAnime : copy.searchPlaces}
        aria-busy={query !== deferred}
      >
        {results.map((item) => {
          const isSelected = selected(item);
          const title = localizedNavText(
            {
              zh: item.titles.zh ?? "",
              tw: item.titles.tw,
              ja: item.titles.ja ?? "",
              en: item.titles.en ?? "",
            },
            locale,
          );
          return (
            <li key={`${item.kind}:${item.id}`}>
              <button
                type="button"
                disabled={isSelected}
                onClick={() => onSelect(item.kind, item.id)}
                aria-label={`${isSelected ? copy.added : copy.add} ${title}`}
              >
                <span>
                  <strong>{title}</strong>
                  <small>{item.subtitle ?? copy.searchAnime}</small>
                </span>
                <span className="trip-add-icon" aria-hidden="true">
                  {isSelected ? "✓" : "+"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!results.length && (
        <p className="trip-muted" role="status">
          {copy.noResults}
        </p>
      )}
    </section>
  );
}
