"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isSoftNav } from "~/components/site/soft-nav";
import {
  matchAnimeTitles,
  type AnimeSearchRecord,
} from "~/lib/anime-title-search";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

export interface AnimeIndexEntry extends AnimeSearchRecord {
  href: string;
  title: string;
  meta: string;
}

export function AnimeIndexBrowser({
  locale,
  items,
}: {
  locale: PilgrimageLocale;
  items: AnimeIndexEntry[];
}) {
  const copy = getPilgrimageCopy(locale);
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(() =>
    isSoftNav() ? 0 : items.length,
  );
  useEffect(() => {
    if (count >= items.length) return;
    let current = count;
    let timer = 0;
    const step = () => {
      current = Math.min(items.length, current + 36);
      setCount(current);
      if (current < items.length) timer = window.setTimeout(step, 16);
    };
    timer = window.setTimeout(step, 16);
    return () => window.clearTimeout(timer);
  }, [count, items.length]);
  const needle = query.trim();
  const visible = useMemo(
    () => (needle ? matchAnimeTitles(items, needle) : items),
    [items, needle],
  );

  return (
    <div>
      <label htmlFor="anime-work-search" className="sr-only">
        {copy.searchWorks}
      </label>
      <input
        id="anime-work-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.searchWorks}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-testid="anime-index-search"
        className="anime-search-input mb-4 w-full min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-pink-100/40 focus:border-cyan-200/50"
      />
      {needle && visible.length === 0 ? (
        <p className="text-sm text-pink-100/70" role="status">
          {copy.searchWorksEmpty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.slice(0, needle ? visible.length : count).map((anime) => (
            <Link
              key={anime.subjectId}
              href={anime.href}
              className="anime-panel block p-4 transition hover:border-pink-200/40 hover:bg-white/10"
            >
              <h2 className="text-base font-black text-white">{anime.title}</h2>
              <p className="mt-2 text-sm text-pink-100/65">{anime.meta}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
