import { afterEach, describe, expect, it, vi } from "vitest";
import { getDemoPlayerSession, getStoredPlayerSession } from "./player-session";

describe("stored player session", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns no session during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("does not crash public pages when the storage getter is blocked", () => {
    const blockedWindow = Object.defineProperty({}, "localStorage", {
      get: () => {
        throw new Error("Storage access denied");
      },
    });
    vi.stubGlobal("window", blockedWindow);
    expect(getStoredPlayerSession()).toBeNull();
  });

  it("handles storage read failures and malformed sessions", () => {
    const getItem = vi.fn((): string | null => {
      throw new Error("Storage read denied");
    });
    vi.stubGlobal("window", { localStorage: { getItem } });
    expect(getStoredPlayerSession()).toBeNull();
    for (const raw of [null, "broken", "null", '{"token":"missing-user"}']) {
      getItem.mockReturnValue(raw);
      expect(getStoredPlayerSession()).toBeNull();
    }
  });

  it("keeps valid sessions and normalizes a legacy missing high score", () => {
    const session = getDemoPlayerSession();
    const getItem = vi.fn(() => JSON.stringify(session));
    vi.stubGlobal("window", { localStorage: { getItem } });
    expect(getStoredPlayerSession()).toEqual(session);
    expect(getItem).toHaveBeenCalledWith("histoguessr_player_session");
    getItem.mockReturnValue(
      JSON.stringify({
        ...session,
        user: { ...session.user, soloHighScore: undefined },
      }),
    );
    expect(getStoredPlayerSession()?.user.soloHighScore).toBe(0);
  });
});
