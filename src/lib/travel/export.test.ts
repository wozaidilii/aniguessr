import { describe, expect, it } from "vitest";
import { buildTripPlan } from "./engine";
import { exportTripText } from "./export";
import { emptyTrip } from "./state";

describe("itinerary export", () => {
  it("retains manual day groups and does not claim a scheduled break on a free day", () => {
    const catalog = { animes: {}, spots: [] };
    const state = {
      ...emptyTrip(),
      routeIds: ["hub:kamakura", "hub:enoshima"],
      dayBreakBefore: ["hub:enoshima"],
    };
    const text = exportTripText(
      buildTripPlan(catalog, state),
      state,
      catalog,
      "en",
    );
    const day2 = text.split("## Day 2")[1]!.split("## Day 3")[0]!;
    expect(day2).toContain("Katase-Enoshima Station");
    expect(day2).toContain("origin=");
    const freeDay = text.split("## Day 3")[1]!.split("## Guides")[0]!;
    expect(freeDay).toContain("A free day");
    expect(freeDay).not.toContain("Includes 60 min");
  });
});
