import { describe, expect, it } from "vitest";
import type { NavCatalog } from "~/lib/pilgrimage-nav";
import { buildTripPlan, spotStop } from "./engine";
import { emptyTrip } from "./state";
import { recommendGuides, TRAVEL_GUIDES } from "./guides";
import { klookRegionFor, travelRegionFor } from "./regions";
import { buildCommunityQuestion, exportGuideText } from "./guide-export";
import { exportTripText } from "./export";

const catalog: NavCatalog = { animes: {}, spots: [] };
describe("source-backed destination recommendations", () => {
  it("does not assign Japan to neighboring countries or unknown destinations", () => {
    for (const point of [
      { lat: 25.03, lng: 121.56 },
      { lat: 35.18, lng: 129.07 },
      { lat: 31.23, lng: 121.47 },
      { lat: 37.57, lng: 126.98 },
    ]) {
      const stop = spotStop({
        ...point,
        id: "foreign",
        subjectId: "a",
        locationSlug: "foreign",
        name: { zh: "Place", ja: "Place", en: "Place" },
      });
      expect(travelRegionFor(point)).toBeUndefined();
      expect(klookRegionFor(stop)).toBe("global");
      const data = {
        animes: {},
        spots: [
          {
            ...point,
            id: "foreign",
            subjectId: "a",
            locationSlug: "foreign",
            name: stop.name,
          },
        ],
      };
      const state = { ...emptyTrip(), spotIds: ["foreign"] };
      expect(recommendGuides(buildTripPlan(data, state), state, "zh")).toEqual(
        [],
      );
    }
  });
  it("covers every scheduled destination before adding duplicate regional recommendations", () => {
    const state = {
      ...emptyTrip(),
      mode: "route" as const,
      days: 7,
      routeIds: ["hub:tokyo", "hub:hakone", "hub:kyoto", "hub:osaka"],
    };
    const guides = recommendGuides(buildTripPlan(catalog, state), state, "zh");
    expect(new Set(guides.flatMap((item) => item.regions))).toEqual(
      new Set(["tokyo", "hakone", "kyoto", "osaka"]),
    );
    expect(guides.length).toBeLessThanOrEqual(8);
    expect(new Set(guides.map((item) => item.guide.id)).size).toBe(
      guides.length,
    );
  });
  it("omits guides for unscheduled destinations and unselected interests", () => {
    const state = {
      ...emptyTrip(),
      mode: "route" as const,
      days: 1,
      routeIds: ["hub:tokyo", "hub:osaka"],
      transport: "walking" as const,
      interests: [],
    };
    const guides = recommendGuides(buildTripPlan(catalog, state), state, "en");
    expect(guides.flatMap((item) => item.regions)).toEqual(["tokyo"]);
    expect(guides.some((item) => item.guide.id === "osaka-food")).toBe(false);
  });
  it("exports attributed guides and a community draft without exact dates or private URLs", () => {
    const state = {
      ...emptyTrip(),
      routeIds: ["hub:kamakura", "hub:enoshima"],
      startDate: "2026-12-15",
    };
    const plan = buildTripPlan(catalog, state);
    const text = exportGuideText(plan, state, "zh");
    expect(text).toContain("Klook Taiwan");
    expect(text).toContain("https://www.klook.com/zh-TW/blog/tokyo-enoshima/");
    expect(exportTripText(plan, state, catalog, "zh")).toContain(text);
    const question = buildCommunityQuestion(plan, state, catalog);
    expect(question).toContain("Kamakura Station");
    expect(question).not.toContain(state.startDate);
    expect(question).not.toMatch(/https?:|#trip=|35\.3191/);
  });
  it("keeps guide links canonical, secure, attributable and dated", () => {
    for (const guide of TRAVEL_GUIDES) {
      const url = new URL(guide.url);
      expect(url.protocol).toBe("https:");
      expect(url.search).toBe("");
      expect(guide.publisher.length).toBeGreaterThan(0);
      expect(guide.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.regions.length).toBeGreaterThan(0);
    }
  });
});
