import { describe, expect, it } from "vitest";
import {
  clusterHaloRadius,
  clusterRadius,
  layoutAreaMarkers,
  layoutSpotMarkers,
  layoutWorkMarkers,
  mergeOverlappingClusters,
  resolveMarkers,
} from "~/lib/og/map";

describe("og map markers", () => {
  it("pins a spot at the fixed focus point and drops markers outside it", () => {
    const layout = layoutSpotMarkers(
      { lat: 35.3, lng: 139.5 },
      [
        { lat: 35.3 + 1 / 111.32, lng: 139.5 },
        {
          lat: 35.3,
          lng: 139.5 + 2.2 / (111.32 * Math.cos((35.3 * Math.PI) / 180)),
        },
      ],
      "coast",
    );
    expect(layout.activePin).toEqual({ x: 445, y: 321 });
    expect(layout.minorPins).toHaveLength(1);
    expect(layout.minorPins[0]?.y).toBeLessThan(321);
    expect(Math.abs((layout.minorPins[0]?.y ?? 0) - (321 - 180))).toBeLessThan(
      1,
    );
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

  it("merges clusters whose halos touch and leaves distant ones", () => {
    const merged = mergeOverlappingClusters([
      { x: 100, y: 100, n: 19 },
      { x: 110, y: 100, n: 12 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.n).toBe(31);
    expect(merged[0]?.x).toBe(103.87);
    expect(merged[0]?.y).toBe(100);
    const apart = mergeOverlappingClusters([
      { x: 0, y: 0, n: 2 },
      { x: 200, y: 0, n: 3 },
    ]);
    expect(apart).toHaveLength(2);
    expect(apart.map((item) => item.n).sort()).toEqual([2, 3]);
  });

  it("merges halos that overlap even when the solid circles do not", () => {
    expect(clusterRadius(4)).toBe(24);
    expect(clusterHaloRadius(4)).toBe(35);
    const merged = mergeOverlappingClusters([
      { x: 0, y: 0, n: 4 },
      { x: 70, y: 0, n: 5 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.n).toBe(9);
    expect(merged[0]?.x).toBe(38.89);
    const clear = mergeOverlappingClusters([
      { x: 0, y: 0, n: 4 },
      { x: 76, y: 0, n: 5 },
    ]);
    expect(clear).toHaveLength(2);
  });

  it("drops a single pin whose head touches a cluster halo or another pin", () => {
    const resolved = resolveMarkers(
      [
        { x: 100, y: 118 },
        { x: 400, y: 200 },
        { x: 420, y: 200 },
        { x: 441, y: 200 },
      ],
      [{ x: 100, y: 100, n: 2 }],
    );
    expect(resolved.clusters).toEqual([{ x: 100, y: 100, n: 2 }]);
    expect(resolved.singles).toEqual([
      { x: 400, y: 200 },
      { x: 441, y: 200 },
    ]);
  });
});
