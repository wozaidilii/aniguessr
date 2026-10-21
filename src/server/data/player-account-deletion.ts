export interface PlayerAccountDeletionPlan {
  playerId: string;
  /**
   * Normalized email. Activity rows are deleted by this email even when
   * `player_id` was already set null. Null when the account has no email.
   */
  email: string | null;
}

export function planPlayerAccountDeletion(player: {
  id: string;
  email?: string | null;
}): PlayerAccountDeletionPlan {
  const email = player.email?.trim().toLowerCase() ?? "";
  return {
    playerId: player.id,
    email: email.length > 0 ? email : null,
  };
}
