import { describe, expect, it } from "vitest";
import {
  emptyTrip,
  parseTrip,
  tripDate,
  tripFromHash,
  tripShareUrl,
} from "./state";
import { formatTripTime } from "./export";

describe("trip draft boundaries", () => {
  it("round trips all inputs including unicode and manual order", () => {
    const state = {
      ...emptyTrip(),
      spotIds: ["a&b/地点"],
      routeIds: ["hub:tokyo", "hub:kyoto"],
      stopOrder: ["spot:a&b/地点"],
      startDate: "2026-12-30",
    };
    const url = new URL(tripShareUrl("https://example.org", "zh-tw", state));
    expect(url.pathname).toBe("/zh-tw/pilgrimage/planner");
    expect(url.search).toBe("");
    expect(tripFromHash(url.hash)).toEqual(state);
    expect(parseTrip(JSON.stringify(state))).toEqual(state);
  });
  it("rejects corrupt, oversized, invalid date and unsupported version state", () => {
    for (const raw of [
      "null",
      "{}",
      "[",
      "a".repeat(32001),
      JSON.stringify({ ...emptyTrip(), days: -1 }),
      JSON.stringify({ ...emptyTrip(), version: 2 }),
      JSON.stringify({ ...emptyTrip(), startDate: "2026-02-30" }),
      JSON.stringify({ ...emptyTrip(), radiusKm: 200 }),
    ])
      expect(parseTrip(raw)).toBeNull();
    expect(tripFromHash("#trip=%E0%A4%A")).toBeNull();
    expect(tripFromHash("#other=value")).toBeNull();
  });
  it("deduplicates input IDs and bounds selection size", () => {
    expect(
      parseTrip(
        JSON.stringify({ ...emptyTrip(), visitMinutes: { "spot:x": 9999 } }),
      ),
    ).toBeNull();
    expect(
      parseTrip(JSON.stringify({ ...emptyTrip(), spotIds: ["x", "x"] }))
        ?.spotIds,
    ).toEqual(["x"]);
    expect(
      parseTrip(
        JSON.stringify({
          ...emptyTrip(),
          animeIds: Array.from({ length: 9 }, (_, i) => String(i)),
        }),
      ),
    ).toBeNull();
  });
  it("uses calendar dates across year boundaries and labels next-day estimates", () => {
    expect(tripDate("2026-12-31", 2, "en")).toContain("Jan 1");
    expect(tripDate("", 2, "en")).toBe("");
    expect(formatTripTime(1500)).toBe("01:00 (+1d)");
  });
});
