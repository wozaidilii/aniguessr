import { describe, expect, it } from "vitest";
import { planPlayerAccountDeletion } from "~/server/data/player-account-deletion";

describe("player account deletion plan", () => {
  it("deletes activity rows by the normalized email", () => {
    expect(
      planPlayerAccountDeletion({ id: "player-1", email: " A@Example.com " }),
    ).toEqual({
      playerId: "player-1",
      email: "a@example.com",
    });
  });

  it("still identifies the player when there is no email to match", () => {
    expect(planPlayerAccountDeletion({ id: "wechat-1", email: null })).toEqual({
      playerId: "wechat-1",
      email: null,
    });
    expect(
      planPlayerAccountDeletion({ id: "wechat-2", email: "  " }).email,
    ).toBe(null);
  });
});
