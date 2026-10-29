import { describe, expect, it } from "vitest";
import { type NavCatalog, type NavSpot } from "~/lib/pilgrimage-nav";
import {
  buildTripPlan,
  distanceKm,
  distanceToSegment,
  estimateTravelMinutes,
  legDirectionsUrl,
  routeProximity,
  scheduleStops,
  spotStop,
} from "./engine";
import { emptyTrip } from "./state";
import { TRAVEL_PLACES } from "./catalog";

const name = { zh: "圣地", tw: "聖地", ja: "聖地", en: "Place" };
function spot(id: string, lat: number, lng: number, subjectId = "a"): NavSpot {
  return { id, lat, lng, subjectId, name, locationSlug: "city" };
}
const catalog = (spots: NavSpot[]): NavCatalog => ({
  animes: { a: name, b: name },
  spots,
});

describe("travel corridor geometry", () => {
  it("measures cross-track distance and clamps to endpoints", () => {
    const start = { lat: 0, lng: 0 },
      end = { lat: 0, lng: 2 };
    expect(
      distanceToSegment({ lat: 0.01, lng: 1 }, start, end).distanceKm,
    ).toBeCloseTo(1.112, 2);
    expect(distanceToSegment({ lat: 0, lng: -1 }, start, end).progressKm).toBe(
      0,
    );
    expect(
      distanceToSegment({ lat: 0, lng: 3 }, start, end).distanceKm,
    ).toBeCloseTo(111.195, 2);
  });
  it("handles empty, repeated, one-point routes and date-line crossing", () => {
    expect(routeProximity({ lat: 0, lng: 0 }, []).distanceKm).toBe(Infinity);
    expect(
      routeProximity({ lat: 0, lng: 0 }, [{ lat: 0, lng: 0 }]).distanceKm,
    ).toBe(0);
    expect(
      distanceToSegment(
        { lat: 1, lng: 1 },
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
      ).distanceKm,
    ).toBeGreaterThan(150);
    expect(
      distanceToSegment(
        { lat: 0, lng: 180 },
        { lat: 0, lng: 179 },
        { lat: 0, lng: -179 },
      ).distanceKm,
    ).toBeCloseTo(0);
  });
  it("excludes points outside the corridor and keeps multiple works at one place", () => {
    const data = catalog([
      spot("s", 0, 0),
      spot("e", 0, 2),
      spot("near", 0.01, 1),
      spot("same-frame", 0.01001, 1),
      spot("other-work", 0.01, 1, "b"),
      spot("far", 1, 1),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      mode: "route",
      routeIds: ["spot:s", "spot:e"],
      radiusKm: 3,
    });
    expect(plan.discoveries.map((item) => item.stop.spotId)).toEqual([
      "near",
      "other-work",
    ]);
  });
});

describe("itinerary selection and ordering", () => {
  it("discovers around existing visits when route mode has no anchors", () => {
    const data = catalog([
      spot("start", 35, 139),
      spot("end", 35.04, 139),
      spot("near", 35.02, 139.001),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      mode: "route",
      spotIds: ["start", "end"],
    });
    expect(plan.discoveries.map((item) => item.stop.spotId)).toContain("near");
  });
  it("does not count a selected anime anchor as omitted", () => {
    const plan = buildTripPlan(catalog([spot("anchor", 35, 139)]), {
      ...emptyTrip(),
      animeIds: ["a"],
      routeIds: ["spot:anchor"],
    });
    expect(plan.ordered.map((stop) => stop.spotId)).toEqual(["anchor"]);
    expect(plan.omittedAnimeSpots).toBe(0);
  });
  it("removes a crossing introduced by nearest-neighbor ordering without moving the start", () => {
    const points = [
      spot("start", 0, 0),
      spot("middle", 0.02, 0.02),
      spot("east", 0, 0.03),
      spot("north", 0.03, 0),
    ];
    const plan = buildTripPlan(catalog(points), {
      ...emptyTrip(),
      spotIds: points.map((point) => point.id),
    });
    expect(plan.ordered[0]?.spotId).toBe("start");
    expect(new Set(plan.ordered.map((stop) => stop.spotId))).toEqual(
      new Set(points.map((point) => point.id)),
    );
    const total = plan.ordered.reduce(
      (km, stop, index) =>
        km + (index ? distanceKm(plan.ordered[index - 1]!, stop) : 0),
      0,
    );
    // A non-crossing route for this four-stop layout is about 8.3 km;
    // the greedy crossing is over 10 km.
    expect(total).toBeLessThan(8.5);
  });
  it("does not add automatic frames beside explicit visits or in a remote region", () => {
    const data = catalog([
      spot("chosen", 35, 139),
      spot("frame", 35.0001, 139),
      spot("local", 35.02, 139),
      spot("remote", 36, 136),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      animeIds: ["a"],
      spotIds: ["chosen"],
    });
    expect(plan.ordered.map((stop) => stop.spotId)).toEqual([
      "chosen",
      "local",
    ]);
    const explicitRemote = buildTripPlan(data, {
      ...emptyTrip(),
      animeIds: ["a"],
      spotIds: ["chosen", "remote"],
    });
    expect(
      explicitRemote.ordered.some((stop) => stop.spotId === "remote"),
    ).toBe(true);
  });
  it("retains explicit choices, caps auto selection, ignores invalid coordinates", () => {
    const points = Array.from({ length: 20 }, (_, i) =>
      spot(String(i), 35 + i * 0.01, 139),
    );
    const data = catalog([
      ...points,
      spot("bad", NaN, 139),
      spot("outside", 95, 139),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      animeIds: ["a"],
      spotIds: ["19", "19"],
    });
    expect(plan.ordered.filter((stop) => stop.spotId === "19")).toHaveLength(1);
    expect(plan.ordered).toHaveLength(7);
    expect(
      plan.ordered.some((stop) =>
        ["bad", "outside"].includes(stop.spotId ?? ""),
      ),
    ).toBe(false);
    expect(plan.omittedAnimeSpots).toBe(13);
  });
  it("does not silently collapse explicitly selected frames at the same position", () => {
    const plan = buildTripPlan(
      catalog([spot("1", 35, 139), spot("2", 35, 139)]),
      { ...emptyTrip(), spotIds: ["1", "2"] },
    );
    expect(plan.ordered).toHaveLength(2);
  });
  it("preserves fixed anchors and inserts a selected detour between them", () => {
    const data = catalog([
      spot("start", 0, 0),
      spot("end", 0, 2),
      spot("mid", 0.01, 1),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      mode: "route",
      routeIds: ["spot:start", "spot:end"],
      spotIds: ["end", "mid"],
      stopOrder: ["spot:end", "spot:start"],
    });
    expect(plan.ordered.map((stop) => stop.spotId)).toEqual([
      "start",
      "mid",
      "end",
    ]);
  });

  it("orders extras from a single selected origin instead of the first added extra", () => {
    const data = catalog([
      spot("origin", 35, 139),
      spot("far", 35.1, 139),
      spot("near", 35.01, 139),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      routeIds: ["spot:origin"],
      spotIds: ["far", "near"],
    });
    expect(plan.ordered.map((stop) => stop.spotId)).toEqual([
      "origin",
      "near",
      "far",
    ]);
  });
  it("honors manual anime order and does not re-add exclusions", () => {
    const data = catalog([
      spot("1", 35, 139),
      spot("2", 35.01, 139),
      spot("3", 35.02, 139),
    ]);
    const plan = buildTripPlan(data, {
      ...emptyTrip(),
      animeIds: ["a"],
      excludedIds: ["spot:2"],
      stopOrder: ["spot:3", "spot:1"],
    });
    expect(plan.ordered.map((stop) => stop.spotId)).toEqual(["3", "1"]);
  });
  it("reports disappeared IDs and filters discoveries by selected work", () => {
    const plan = buildTripPlan(
      catalog([spot("start", 35, 139), spot("b", 35, 139, "b")]),
      {
        ...emptyTrip(),
        mode: "route",
        animeIds: ["a", "missing"],
        routeIds: ["spot:start", "hub:missing"],
        spotIds: ["missing"],
      },
    );
    expect(plan.unknownIds).toEqual(["hub:missing", "spot:missing", "missing"]);
    expect(plan.discoveries).toEqual([]);
  });
  it("shows only interested curated places near the route", () => {
    const plan = buildTripPlan(catalog([]), {
      ...emptyTrip(),
      mode: "route",
      routeIds: ["hub:hakone"],
      interests: ["onsen"],
      radiusKm: 5,
    });
    expect(plan.nearby.map((item) => item.stop.id)).toEqual([
      "place:hakone-yuryo",
    ]);
    expect(
      TRAVEL_PLACES.find((place) => place.id === "hakone-yuryo")?.sourceUrl,
    ).toMatch(/^https:\/\//);
  });
});

describe("daily budgets", () => {
  it("starts a requested new day and carries its transfer without moving the first visit", () => {
    const stops = [
      spotStop(spot("a", 35, 139)),
      spotStop(spot("b", 35.01, 139)),
      spotStop(spot("c", 35.02, 139)),
    ];
    const state = {
      ...emptyTrip(),
      days: 2,
      dayBreakBefore: ["spot:a", "spot:b"],
    };
    const result = scheduleStops(stops, state);
    expect(
      result.days.map((day) => day.stops.map(({ stop }) => stop.id)),
    ).toEqual([["spot:a"], ["spot:b", "spot:c"]]);
    const transfer = result.days[1]!.stops[0]!;
    expect(transfer.from?.id).toBe("spot:a");
    expect(transfer.travelMinutes).toBeGreaterThan(0);
    expect(transfer.arrivalMinutes).toBe(540 + transfer.travelMinutes);
    expect(result.unscheduled).toEqual([]);
  });
  it("does not skip two days when a manual boundary also exceeds the time budget", () => {
    const stops = [
      spotStop(spot("a", 35, 139)),
      spotStop(spot("b", 35, 139)),
    ].map((stop) => ({ ...stop, minutes: 200 }));
    const result = scheduleStops(stops, {
      ...emptyTrip(),
      days: 2,
      pace: "relaxed",
      dayBreakBefore: ["spot:b"],
    });
    expect(result.days.map((day) => day.stops.length)).toEqual([1, 1]);
    expect(result.unscheduled).toEqual([]);
  });
  it("retains overflow from manual boundaries and refits it when the boundary is reset", () => {
    const stops = [
      spotStop(spot("a", 35, 139)),
      spotStop(spot("b", 35, 139)),
      spotStop(spot("c", 35, 139)),
    ];
    const state = { ...emptyTrip(), days: 1, dayBreakBefore: ["spot:b"] };
    const result = scheduleStops(stops, state);
    expect(result.unscheduled.map((stop) => stop.id)).toEqual([
      "spot:b",
      "spot:c",
    ]);
    const reset = scheduleStops(stops, { ...state, dayBreakBefore: [] });
    expect(reset.days[0]!.stops).toHaveLength(3);
    expect(reset.unscheduled).toEqual([]);
  });
  it.each(["walking", "driving", "transit"] as const)(
    "keeps %s estimates non-decreasing across distance thresholds",
    (mode) => {
      let previous = 0;
      for (let km = 0; km <= 250; km += 0.1) {
        const minutes = estimateTravelMinutes(km, mode);
        expect(minutes).toBeGreaterThanOrEqual(previous);
        previous = minutes;
      }
    },
  );
  it("respects edited visit duration and persists overflow without dropping stops", () => {
    const state = {
      ...emptyTrip(),
      days: 1,
      spotIds: ["1", "2"],
      visitMinutes: { "spot:1": 400 },
    };
    const result = buildTripPlan(
      catalog([spot("1", 35, 139), spot("2", 35, 139)]),
      state,
    );
    expect(result.days[0]?.stops[0]?.stop.minutes).toBe(400);
    expect(result.days[0]?.overBudget).toBe(true);
    expect(result.unscheduled.map((stop) => stop.id)).toEqual(["spot:2"]);
  });
  it("retains overflow and accounts for a transfer crossing a day boundary", () => {
    const stops = Array.from({ length: 6 }, (_, i) => ({
      ...spotStop(spot(String(i), 35 + i * 0.02, 139)),
      minutes: 100,
    }));
    const result = scheduleStops(stops, {
      days: 2,
      pace: "relaxed",
      transport: "walking",
    });
    expect(result.unscheduled.length).toBeGreaterThan(0);
    expect(
      result.days.flatMap((day) => day.stops).length +
        result.unscheduled.length,
    ).toBe(stops.length);
    const secondDayFirst = result.days[1]?.stops[0];
    expect(secondDayFirst?.travelMinutes).toBeGreaterThan(0);
    expect(secondDayFirst?.from?.id).toBe(
      result.days[0]?.stops.at(-1)?.stop.id,
    );
  });
  it("marks impossible single-leg days instead of pretending they fit", () => {
    const stops = [
      spotStop(spot("tokyo", 35.68, 139.76)),
      spotStop(spot("kyoto", 35, 135.76)),
    ];
    const result = scheduleStops(stops, {
      days: 2,
      pace: "relaxed",
      transport: "walking",
    });
    expect(result.days[1]?.overBudget).toBe(true);
    expect(result.days[1]?.stops[0]?.travelMinutes).toBeGreaterThan(1000);
  });
  it("includes breaks and keeps chronological visits with a visible gap", () => {
    const stops = Array.from({ length: 5 }, (_, i) => ({
      ...spotStop(spot(String(i), 35, 139)),
      minutes: 60,
    }));
    const result = scheduleStops(stops, {
      days: 1,
      pace: "full",
      transport: "transit",
    });
    expect(result.days[0]?.minutes).toBe(360);
    const visits = result.days[0]!.stops;
    expect(visits[3]!.arrivalMinutes - visits[2]!.departureMinutes).toBe(60);
    expect(
      visits.every(
        (visit, i) =>
          !i || visit.arrivalMinutes >= visits[i - 1]!.departureMinutes,
      ),
    ).toBe(true);
  });
  it("estimates zero-distance transfers and mode differences", () => {
    expect(estimateTravelMinutes(0, "walking")).toBe(0);
    expect(estimateTravelMinutes(20, "walking")).toBeGreaterThan(
      estimateTravelMinutes(20, "transit"),
    );
  });
  it("exports each transit leg without unsupported intermediate waypoints", () => {
    const url = new URL(
      legDirectionsUrl({ lat: 35, lng: 139 }, { lat: 36, lng: 140 }, "transit"),
    );
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("origin")).toBe("35,139");
    expect(url.searchParams.get("destination")).toBe("36,140");
    expect(url.searchParams.get("travelmode")).toBe("transit");
    expect(url.searchParams.has("waypoints")).toBe(false);
  });
});
