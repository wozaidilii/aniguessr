"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  HOME_FOCUS_WORK_EVENT,
  HOME_MAP_GESTURE_EVENT,
} from "~/components/home/home-events";
import type { PopularAnimeChip } from "~/lib/popular-anime";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  matchPreparedAnimeTitles,
  prepareAnimeSearch,
  type AnimeSearchRecord,
} from "~/lib/anime-title-search";
import {
  loadNavCatalog,
  localizedNavText,
  type NavCatalog,
} from "~/lib/pilgrimage-nav";

interface HomeSearchHit extends AnimeSearchRecord {
  title: string;
  spotCount: number;
}

function hitsFromCatalog(
  catalog: NavCatalog,
  locale: HomeLocale,
): HomeSearchHit[] {
  const counts = new Map<string, number>();
  for (const spot of catalog.spots) {
    counts.set(spot.subjectId, (counts.get(spot.subjectId) ?? 0) + 1);
  }
  return Object.entries(catalog.animes).map(([subjectId, titles]) => ({
    subjectId,
    titles,
    title:
      localizedNavText(titles, locale) || titles.ja || titles.en || titles.zh,
    spotCount: counts.get(subjectId) ?? 0,
  }));
}

function focusHomeWork(subjectId: string | null) {
  window.dispatchEvent(
    new CustomEvent(HOME_FOCUS_WORK_EVENT, {
      detail: { subjectId },
    }),
  );
}

export function HomeWorkSearch({
  locale,
  popular,
}: {
  locale: HomeLocale;
  popular: PopularAnimeChip[];
}) {
  const copy = getHomePageCopy(locale);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<NavCatalog | null>(null);
  const [ready, setReady] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [chipsOverflow, setChipsOverflow] = useState(false);
  const chipRowRef = useRef<HTMLDivElement | null>(null);
  const countTag = locale === "zh-tw" ? "zh-TW" : locale;

  useEffect(() => {
    let cancelled = false;
    void loadNavCatalog()
      .then((value) => {
        if (!cancelled) setCatalog(value);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const prepared = useMemo(
    () => prepareAnimeSearch(catalog ? hitsFromCatalog(catalog, locale) : []),
    [catalog, locale],
  );
  const needle = query.trim();
  const showList = open && needle.length > 0 && selectedId === null;
  const results = useMemo(
    () => (showList ? matchPreparedAnimeTitles(prepared, needle, 8) : []),
    [prepared, needle, showList],
  );
  const activeIndex =
    results.length === 0 ? 0 : Math.min(active, results.length - 1);
  const activeId =
    showList && results[activeIndex]
      ? `${listId}-${results[activeIndex].subjectId}`
      : undefined;

  useEffect(() => {
    function onGesture() {
      if (window.matchMedia("(max-width: 1023px)").matches) return;
      setChipsOpen(false);
      setShowAll(false);
    }
    window.addEventListener(HOME_MAP_GESTURE_EVENT, onGesture);
    return () => window.removeEventListener(HOME_MAP_GESTURE_EVENT, onGesture);
  }, []);

  useLayoutEffect(() => {
    const row = chipRowRef.current;
    if (!row) return;
    const measure = () => {
      const chips = [
        ...row.querySelectorAll<HTMLAnchorElement>("a.home-popular-chip"),
      ];
      const tops = chips.map((chip) => chip.offsetTop);
      const rowTops = [...new Set(tops)].sort((a, b) => a - b);
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const secondRow = rowTops[1];
      const tooMany = desktop && rowTops.length > 2;
      setChipsOverflow(tooMany);
      chips.forEach((chip, index) => {
        const clipped =
          tooMany &&
          !showAll &&
          secondRow !== undefined &&
          tops[index] !== undefined &&
          tops[index] > secondRow;
        if (clipped) {
          chip.tabIndex = -1;
          chip.setAttribute("aria-hidden", "true");
        } else {
          chip.removeAttribute("tabindex");
          chip.removeAttribute("aria-hidden");
        }
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [showAll, chipsOpen, popular]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function select(hit: { subjectId: string; title: string }) {
    setQuery(hit.title);
    setSelectedId(hit.subjectId);
    setOpen(false);
    focusHomeWork(hit.subjectId);
  }

  function clear() {
    setQuery("");
    setSelectedId(null);
    setOpen(false);
    setActive(0);
    focusHomeWork(null);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = results[activeIndex];
      if (hit) select(hit);
    }
  }

  const animeHref = withPilgrimageLocale("/pilgrimage/anime", locale);
  const favoritesHref = withPilgrimageLocale("/pilgrimage#favorites", locale);

  return (
    <div
      className="home-work-search"
      ref={rootRef}
      data-testid="home-work-search"
      data-collapsed={chipsOpen ? "false" : "true"}
      onClick={() => setChipsOpen(true)}
      onFocus={() => setChipsOpen(true)}
    >
      <div className="home-search">
        <label htmlFor="home-work-search" className="home-sr">
          {copy.searchWorks}
        </label>
        <div className="home-search-field">
          <SearchIcon />
          <input
            ref={inputRef}
            id="home-work-search"
            type="search"
            role="combobox"
            value={query}
            placeholder={copy.searchWorks}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={showList ? listId : undefined}
            aria-activedescendant={activeId}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
              setOpen(true);
              setActive(0);
              if (selectedId) focusHomeWork(null);
            }}
            onFocus={() => {
              if (selectedId === null && query.trim()) setOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="home-search-clear"
              aria-label={copy.searchClear}
              onClick={clear}
            >
              ×
            </button>
          ) : null}
        </div>
        {showList && results.length > 0 ? (
          <ul id={listId} role="listbox" className="home-search-results">
            {results.map((hit, index) => (
              <li key={hit.subjectId} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${listId}-${hit.subjectId}`}
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(hit)}
                >
                  <span>{hit.title}</span>
                  <small>{copy.searchSpotCount(hit.spotCount)}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {showList && ready && results.length === 0 ? (
          <p className="home-search-empty" role="status">
            {copy.searchWorksEmpty}
          </p>
        ) : null}
      </div>
      {popular.length > 0 ? (
        <div className="home-popular" data-testid="home-popular">
          <p className="home-popular-label">{copy.popularWorks}</p>
          <div
            className={`home-popular-row${showAll ? " is-all" : ""}`}
            ref={chipRowRef}
          >
            {popular.map((work) => (
              <a
                key={work.subjectId}
                href={work.href}
                className="home-popular-chip"
              >
                <b>{work.title}</b>
                <small>{work.spotCount.toLocaleString(countTag)}</small>
              </a>
            ))}
          </div>
          {chipsOverflow && !showAll ? (
            <button
              type="button"
              className="home-popular-more"
              data-testid="home-show-all"
              onClick={() => setShowAll(true)}
            >
              {copy.showAllWorks}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="home-pills">
        <a href={animeHref}>{copy.searchPill}</a>
        <a href={favoritesHref}>{copy.favoritesPill}</a>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="home-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16.5 20 20.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
