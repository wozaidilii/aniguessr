"use client";

import { useEffect, useState } from "react";
import { BattleGame } from "./BattleGame";
import { AuthLoading } from "~/lib/player-session-guard";
import { getStoredPlayerSession } from "~/lib/player-session";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";
import { getBattleCopy } from "~/lib/battle-copy";
import { sanitizePostHogUrl } from "~/lib/posthog-privacy";
import { type PlayerAvatar, type PlayerSession } from "~/types/player";
import { type BattleSettings } from "~/types/battle";

interface Props {
  roomId: string;
  userId: string;
  avatar: PlayerAvatar;
  isHost: boolean;
  hostSettings: BattleSettings | null;
  locale: AnimeLocale;
}

export function BattleRoomClient({
  roomId,
  userId,
  avatar,
  isHost,
  hostSettings,
  locale,
}: Props) {
  const copy = getBattleCopy(locale);
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const cleaned = sanitizePostHogUrl(current);
    if (cleaned !== current) {
      window.history.replaceState(null, "", cleaned);
    }

    const stored = getStoredPlayerSession();
    if (!stored) {
      const returnPath = sanitizePostHogUrl(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.replace(
        withAnimeLocale(
          `/login?next=${encodeURIComponent(returnPath)}`,
          locale,
        ),
      );
      return;
    }
    if (stored.user.id !== userId) {
      window.location.replace(withAnimeLocale("/battle", locale));
      return;
    }
    setSession(stored);
  }, [locale, userId]);

  if (!session) return <AuthLoading label={copy.loading} />;

  return (
    <BattleGame
      roomId={roomId}
      isHost={isHost}
      playerName={session.user.name}
      playerUserId={session.user.id}
      playerAvatar={avatar}
      hostSettings={hostSettings}
      locale={locale}
    />
  );
}
