import { describe, expect, it } from "vitest";
import {
  KANTO_INITIAL_CENTER,
  KANTO_INITIAL_ZOOM,
  kantoBoundsContain,
} from "~/lib/home-map-bounds";

describe("homepage map bounds", () => {
  it("frames Kanto and Shonan and leaves northeast Asia outside", () => {
    expect(kantoBoundsContain(139.5503, 35.3192)).toBe(true);
    expect(kantoBoundsContain(139.4806, 35.2998)).toBe(true);
    expect(kantoBoundsContain(139.7671, 35.6812)).toBe(true);
    expect(kantoBoundsContain(126.63, 45.75)).toBe(false);
    expect(kantoBoundsContain(125.75, 39.03)).toBe(false);
    expect(kantoBoundsContain(KANTO_INITIAL_CENTER[0], KANTO_INITIAL_CENTER[1])).toBe(
      true,
    );
    expect(KANTO_INITIAL_ZOOM).toBeGreaterThanOrEqual(8);
  });
});
