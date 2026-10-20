import { describe, expect, it } from "vitest";
import {
  LEADERBOARD_EXCLUDED_NAMES,
  isExcludedFromLeaderboard,
} from "~/server/data/leaderboard-exclusions";

describe("leaderboard exclusions", () => {
  it("hides the Teltest account by nickname without requiring a delete", () => {
    expect(LEADERBOARD_EXCLUDED_NAMES).toContain("teltest");
    expect(isExcludedFromLeaderboard({ id: "p1", name: "Teltest" })).toBe(
      true,
    );
    expect(isExcludedFromLeaderboard({ id: "p2", name: "  TELTEST  " })).toBe(
      true,
    );
    expect(isExcludedFromLeaderboard({ id: "p3", name: "seaside_walker" })).toBe(
      false,
    );
  });
});
