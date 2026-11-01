import { describe, expect, it } from "vitest";
import type { HomeMapLabel } from "~/lib/home-map-labels";
import {
  areaBadgeAriaLabel,
  areaBadgeLocationHref,
  areaBadgeTooltip,
  formatAreaBadgeCount,
  homeMapAreaBadgeZoomBand,
  placeAreaBadgeCenters,
} from "~/lib/home-map-area-badge-format";

const tokyoPref: HomeMapLabel = {
  id: "tokyo",
  ja: "東京都",
  zh: "东京都",
  tw: "東京都",
  en: "Tokyo",
  count: 7133,
  lng: 139.69,
  lat: 35.68,
  west: 139.0,
  south: 35.0,
  east: 140.0,
  north: 36.0,
  major: true,
};

const shibuya: HomeMapLabel = {
  id: "shibuya-tokyo",
  ja: "渋谷区",
  zh: "涩谷区",
  tw: "澀谷區",
  en: "Shibuya",
  count: 949,
  lng: 139.7,
  lat: 35.66,
  west: 139.6,
  south: 35.6,
  east: 139.8,
  north: 35.7,
  major: true,
};

describe("formatAreaBadgeCount", () => {
  it("uses ja-JP grouping above 999", () => {
    expect(formatAreaBadgeCount(949)).toBe("949");
    expect(formatAreaBadgeCount(7133)).toBe("7,133");
  });
});

describe("homeMapAreaBadgeZoomBand", () => {
  it("matches pref/area layer zoom ranges", () => {
    expect(homeMapAreaBadgeZoomBand(6.5)).toBe("pref");
    expect(homeMapAreaBadgeZoomBand(7)).toBe("area");
    expect(homeMapAreaBadgeZoomBand(11)).toBe("area");
    expect(homeMapAreaBadgeZoomBand(12)).toBe("none");
  });
});

describe("areaBadgeTooltip", () => {
  it("localizes tooltip copy", () => {
    expect(areaBadgeTooltip(shibuya, "ja")).toBe("渋谷区 · 949件");
    expect(areaBadgeTooltip(shibuya, "en")).toBe("Shibuya · 949 spots");
    expect(areaBadgeTooltip(shibuya, "zh")).toBe("涩谷区 · 949处");
    expect(areaBadgeTooltip(shibuya, "zh-tw")).toBe("澀谷區 · 949處");
  });
});

describe("placeAreaBadgeCenters", () => {
  it("prefers higher counts and skips overlapping badges", () => {
    const viewport = { left: 0, top: 0, right: 400, bottom: 400 };
    const placed = placeAreaBadgeCenters(
      [
        { id: "a", count: 10, x: 100, y: 100 },
        { id: "b", count: 500, x: 105, y: 100 },
      ],
      [],
      viewport,
    );
    expect(placed.map((item) => item.id)).toEqual(["b"]);
  });

  it("skips badges that collide with UI obstacles", () => {
    const viewport = { left: 0, top: 0, right: 400, bottom: 400 };
    const obstacle = { left: 90, top: 90, right: 130, bottom: 130 };
    const placed = placeAreaBadgeCenters(
      [{ id: "a", count: 200, x: 110, y: 110 }],
      [obstacle],
      viewport,
    );
    expect(placed).toHaveLength(0);
  });
});

describe("areaBadgeAriaLabel", () => {
  it("localizes aria labels", () => {
    expect(areaBadgeAriaLabel(shibuya, "ja")).toBe("渋谷区 949件");
    expect(areaBadgeAriaLabel(shibuya, "en")).toBe("Shibuya 949 spots");
  });
});

describe("areaBadgeLocationHref", () => {
  it("never produces a locations href for prefecture badges", () => {
    expect(areaBadgeLocationHref(tokyoPref, "pref", "ja")).toBeNull();
    expect(areaBadgeLocationHref(tokyoPref, "pref", "en")).toBeNull();
  });

  it("links area badges to pilgrimage location pages", () => {
    expect(areaBadgeLocationHref(shibuya, "area", "ja")).toBe(
      "/ja/pilgrimage/locations/shibuya-tokyo",
    );
  });
});
