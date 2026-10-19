import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { getPilgrimageSeoIndex } from "~/server/data/pilgrimage-seo";

export interface IndexablePath {
  path: string;
  priority: number;
}

/** Bare paths. Public URLs are /{locale}/... */
const PUBLIC_ROUTES: IndexablePath[] = [
  { path: "/", priority: 1 },
  { path: "/pilgrimage", priority: 0.95 },
  { path: "/pilgrimage/anime", priority: 0.9 },
  { path: "/pilgrimage/locations", priority: 0.9 },
  { path: "/game", priority: 0.85 },
  { path: "/game/anime", priority: 0.85 },
  { path: "/game/anime-tuxun", priority: 0.8 },
  { path: "/game/tuxun", priority: 0.7 },
  { path: "/game/foreign", priority: 0.7 },
  { path: "/game/solo", priority: 0.7 },
  { path: "/game/history-year", priority: 0.6 },
  { path: "/game/history-tuxun", priority: 0.6 },
  { path: "/character", priority: 0.6 },
  { path: "/login", priority: 0.3 },
];

export function listIndexablePaths(): IndexablePath[] {
  const paths = [...PUBLIC_ROUTES];
  const index = getPilgrimageSeoIndex();
  if (!index) return paths;

  for (const anime of index.animes) {
    paths.push({
      path: `/pilgrimage/anime/${anime.slug}`,
      priority: 0.75,
    });
  }
  for (const location of index.locations) {
    paths.push({
      path: `/pilgrimage/locations/${location.slug}`,
      priority: 0.7,
    });
  }
  for (const spotId of index.spotIds) {
    paths.push({
      path: `/pilgrimage/spots/${encodeSpotId(spotId)}`,
      priority: 0.6,
    });
  }
  return paths;
}
