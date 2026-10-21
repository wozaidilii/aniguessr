import { describe, expect, it } from "vitest";
import {
  PILGRIMAGE_FIT_MAX_ZOOM,
  pilgrimageFitTarget,
  pilgrimageSpotBounds,
} from "~/lib/pilgrimage-map-frame";

describe("pilgrimage map frame", () => {
  it("caps a fitted work at zoom 15 and refuses a view wider than Japan", () => {
    expect(PILGRIMAGE_FIT_MAX_ZOOM).toBe(15);
    expect(pilgrimageFitTarget(8.4, 5.1)).toBe("spots");
    expect(pilgrimageFitTarget(15, 5.1)).toBe("spots");
    expect(pilgrimageFitTarget(4.2, 5.1)).toBe("japan");
    expect(pilgrimageFitTarget(null, 5.1)).toBe("japan");
  });

  it("keeps Okinawa and Tokyo and drops a coordinate in China", () => {
    const bounds = pilgrimageSpotBounds([
      { lng: 139.7, lat: 35.68 },
      { lng: 127.65, lat: 26.21 },
      { lng: 121.47, lat: 31.23 },
    ]);
    expect(bounds).toEqual([
      [127.65, 26.21],
      [139.7, 35.68],
    ]);
  });
});
