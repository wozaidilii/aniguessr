import type { NavCatalog } from "~/lib/pilgrimage-nav";
import { emptyTrip, parseTrip, tripFromHash, tripStateSchema } from "./state";
import { validCoordinate } from "./engine";
import type { TripState } from "./types";

export interface TripEntry {
  state: TripState;
  persist: boolean;
  notice: "" | "restored" | "invalid" | "unknown" | "preview";
  saved: TripState | null;
}

/** Previewing an external trip never writes over the user's device draft. */
export function resolveTripEntry(
  catalog: NavCatalog,
  search: string,
  hash: string,
  savedRaw: string | null,
): TripEntry {
  const saved = savedRaw ? parseTrip(savedRaw) : null;
  const fallback = (notice: TripEntry["notice"]): TripEntry => ({
    state: saved ?? emptyTrip(),
    persist: false,
    notice,
    saved,
  });
  if (hash.startsWith("#trip=")) {
    const shared = tripFromHash(hash);
    return shared
      ? { state: shared, persist: false, notice: "preview", saved }
      : fallback("invalid");
  }
  const params = new URLSearchParams(search);
  const anime = params.get("anime");
  const spot = params.get("spot");
  const area = params.get("area");
  if (anime || spot || area) {
    const next = emptyTrip();
    if (anime) {
      if (!Object.hasOwn(catalog.animes, anime)) return fallback("unknown");
      next.animeIds = [anime];
    }
    if (spot) {
      if (
        !catalog.spots.some((item) => item.id === spot && validCoordinate(item))
      )
        return fallback("unknown");
      next.spotIds = [spot];
    }
    if (area) {
      const places = catalog.spots.filter(
        (item) => item.locationSlug === area && validCoordinate(item),
      );
      if (!places.length) return fallback("unknown");
      // Coordinate medians are robust to isolated frames outside the main area.
      const lat = places.map((item) => item.lat).sort((a, b) => a - b)[
        Math.floor(places.length / 2)
      ]!;
      const lng = places.map((item) => item.lng).sort((a, b) => a - b)[
        Math.floor(places.length / 2)
      ]!;
      const first = [...places].sort(
        (a, b) =>
          (a.lat - lat) ** 2 +
          (a.lng - lng) ** 2 -
          ((b.lat - lat) ** 2 + (b.lng - lng) ** 2),
      )[0]!;
      next.mode = "route";
      next.routeIds = [`spot:${first.id}`];
    }
    const parsed = tripStateSchema.safeParse(next);
    return parsed.success
      ? { state: parsed.data, persist: false, notice: "preview", saved }
      : fallback("invalid");
  }
  if (savedRaw && !saved) return fallback("invalid");
  return {
    state: saved ?? emptyTrip(),
    persist: true,
    notice: saved ? "restored" : "",
    saved,
  };
}

export function removeTripStop(state: TripState, id: string): TripState {
  const visitMinutes = { ...state.visitMinutes };
  delete visitMinutes[id];
  return {
    ...state,
    routeIds: state.routeIds.filter((item) => item !== id),
    spotIds: state.spotIds.filter((item) => `spot:${item}` !== id),
    placeIds: state.placeIds.filter((item) => `place:${item}` !== id),
    excludedIds: [...state.excludedIds.filter((item) => item !== id), id].slice(
      -180,
    ),
    stopOrder: state.stopOrder.filter((item) => item !== id),
    visitMinutes,
  };
}
