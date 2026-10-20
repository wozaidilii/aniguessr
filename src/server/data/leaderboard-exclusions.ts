/**
 * Players omitted from public leaderboard queries.
 * Add a nickname (matched case-insensitively, trimmed) or a player id.
 * Rows stay in the database; they are only hidden from ranking.
 */
export const LEADERBOARD_EXCLUDED_NAMES = ["teltest"] as const;

export const LEADERBOARD_EXCLUDED_PLAYER_IDS: readonly string[] = [];

export function isExcludedFromLeaderboard(player: {
  id?: string | null;
  name?: string | null;
}): boolean {
  const name = player.name?.trim().toLowerCase() ?? "";
  if (
    name.length > 0 &&
    (LEADERBOARD_EXCLUDED_NAMES as readonly string[]).includes(name)
  ) {
    return true;
  }
  const id = player.id?.trim() ?? "";
  return id.length > 0 && LEADERBOARD_EXCLUDED_PLAYER_IDS.includes(id);
}
