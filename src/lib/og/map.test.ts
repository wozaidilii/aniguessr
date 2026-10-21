import { describe, expect, it } from "vitest";
import {
  clusterRadius,
  layoutAreaMarkers,
  layoutSpotMarkers,
  layoutWorkMarkers,
} from "~/lib/og/map";

describe("og map markers", () => {
  it("pins a spot at the fixed focus point and drops markers outside it", () => {
    const layout = layoutSpotMarkers(
      { lat: 35.3, lng: 139.5 },
      [
        { lat: 35.3 + 1 / 111.32, lng: 139.5 },
        { lat: 35.3, lng: 139.5 + 2.2 / (111.32 * Math.cos((35.3 * Math.PI) / 180)) },
      ],
      "coast",
    );
    expect(layout.activePin).toEqual({ x: 445, y: 321 });
    expect(layout.minorPins).toHaveLength(1);
    expect(layout.minorPins[0]?.y).toBeLessThan(321);
    expect(Math.abs((layout.minorPins[0]?.y ?? 0) - (321 - 180))).toBeLessThan(1);
  });

  it("draws individual work pins until there are more than 12", () => {
    const few = Array.from({ length: 12 }, (_, index) => ({
      lat: 35 + index * 0.02,
      lng: 139 + index * 0.02,
    }));
    expect(layoutWorkMarkers(few, "city").pins).toHaveLength(12);
    expect(layoutWorkMarkers(few, "city").clusters).toHaveLength(0);
    const many = Array.from({ length: 13 }, (_, index) => ({
      lat: 35,
      lng: 139 + index * 0.00001,
    }));
    const clustered = layoutWorkMarkers(many, "city");
    expect(clustered.clusters.reduce((sum, item) => sum + item.n, 0)).toBe(13);
    expect(clustered.pins).toHaveLength(0);
  });

  it("always clusters an area and sizes the bubble from the real count", () => {
    const points = [
      { lat: 35.3, lng: 139.48 },
      { lat: 35.3001, lng: 139.4801 },
      { lat: 35.4, lng: 139.6 },
    ];
    const layout = layoutAreaMarkers(points, "coast");
    expect(layout.clusters.length + layout.minorPins.length).toBeGreaterThan(0);
    expect(layout.pins).toHaveLength(0);
    const grouped = layout.clusters.find((item) => item.n >= 2);
    expect(grouped?.n).toBe(2);
    expect(clusterRadius(2)).toBe(24);
    expect(clusterRadius(12)).toBe(29);
    expect(clusterRadius(120)).toBe(34);
  });
});
