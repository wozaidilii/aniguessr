export const FAVORITE_ANIME_STORAGE_KEY = "aniguessr_pilgrimage_favorites_v1";
export const FAVORITES_CHANGED_EVENT = "aniguessr-favorites";

type FavoriteStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): FavoriteStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readFavoriteAnimeIds(
  storage: FavoriteStorage | null = browserStorage(),
): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(FAVORITE_ANIME_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = parsed.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

export function writeFavoriteAnimeIds(
  ids: readonly string[],
  storage: FavoriteStorage | null = browserStorage(),
) {
  if (!storage) return;
  storage.setItem(FAVORITE_ANIME_STORAGE_KEY, JSON.stringify([...ids]));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  }
}

export function toggleFavoriteAnimeId(
  id: string,
  current: readonly string[],
): string[] {
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
}
