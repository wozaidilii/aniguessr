"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  readFavoriteAnimeIds,
  toggleFavoriteAnimeId,
  writeFavoriteAnimeIds,
} from "~/lib/pilgrimage-favorites";

interface FavoritesValue {
  ids: string[];
  ready: boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function PilgrimageFavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setIds(readFavoriteAnimeIds());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
    };
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      ids: ready ? ids : [],
      ready,
      toggle: (id: string) => {
        const next = toggleFavoriteAnimeId(id, readFavoriteAnimeIds());
        writeFavoriteAnimeIds(next);
        setIds(next);
      },
      clear: () => {
        writeFavoriteAnimeIds([]);
        setIds([]);
      },
    }),
    [ids, ready],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoriteAnime(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) {
    throw new Error(
      "useFavoriteAnime must be used inside PilgrimageFavoritesProvider",
    );
  }
  return value;
}
