"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale, withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { useFavoriteAnime } from "~/components/pilgrimage/favorites";

export interface FavoriteAnimeOption {
  id: string;
  slug: string;
  title: string;
  spotCount: number;
}

export function FavoritePicker({
  locale,
  animes,
}: {
  locale: PilgrimageLocale;
  animes: FavoriteAnimeOption[];
}) {
  const copy = getPilgrimageCopy(locale);
  const { ids, toggle, clear } = useFavoriteAnime();
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(ids), [ids]);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? animes.filter((anime) => anime.title.toLowerCase().includes(needle))
    : animes;

  return (
    <section
      id="favorites"
      className="mb-10 scroll-mt-24"
      data-testid="favorite-picker"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-black text-white">{copy.favoritesTitle}</h2>
        {ids.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
          >
            {copy.favoritesClear}
          </button>
        ) : null}
      </div>
      <p className="mb-4 max-w-3xl text-sm leading-6 text-pink-100/70">
        {copy.favoritesHint}
      </p>
      <p
        className="mb-3 text-sm font-bold text-pink-50"
        data-testid="favorite-count"
      >
        {ids.length > 0 ? copy.favoritesCount(ids.length) : copy.favoritesNone}
      </p>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.favoritesSearch}
        aria-label={copy.favoritesSearch}
        className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-pink-100/40 focus:border-cyan-200/50"
      />
      {visible.length === 0 ? (
        <p className="text-sm text-pink-100/60">{copy.favoritesEmpty}</p>
      ) : (
        <ul className="grid max-h-80 gap-2 overflow-auto pr-1">
          {visible.map((anime) => {
            const checked = selected.has(anime.id);
            return (
              <li
                key={anime.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(anime.id)}
                    className="h-5 w-5 accent-pink-300"
                  />
                  <span className="truncate font-bold text-white">
                    {anime.title}
                  </span>
                </label>
                <Link
                  href={withPilgrimageLocale(
                    `/pilgrimage/anime/${anime.slug}`,
                    locale,
                  )}
                  className="shrink-0 text-xs font-bold text-cyan-100/75 hover:text-cyan-50"
                >
                  {copy.spotCountLabel(anime.spotCount)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
