import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  HOME_USER_FLY_ZOOM,
  homeStartupCamera,
  homeUserLocateDetail,
} from "~/lib/home-user-camera";

const mapSource = readFileSync(
  path.join(process.cwd(), "src/components/home/home-map.tsx"),
  "utf8",
);
const locateSource = readFileSync(
  path.join(process.cwd(), "src/components/home/home-locate.tsx"),
  "utf8",
);

describe("homepage user locate camera", () => {
  it("flies to the stored user instead of fitting Kanto", () => {
    expect(homeStartupCamera(false, { lat: 35.3, lng: 139.48 })).toEqual({
      kind: "user",
      lat: 35.3,
      lng: 139.48,
      zoom: HOME_USER_FLY_ZOOM,
    });
    expect(HOME_USER_FLY_ZOOM).toBe(13);
    expect(homeStartupCamera(false, null)).toEqual({ kind: "kanto" });
    expect(homeStartupCamera(false, { lat: Number.NaN, lng: 139.48 })).toEqual({
      kind: "kanto",
    });
  });

  it("leaves a focused work on its own camera", () => {
    expect(homeStartupCamera(true, { lat: 35.3, lng: 139.48 })).toEqual({
      kind: "focus",
    });
  });

  it("shares one locate payload that does not keep the overview zoom", () => {
    expect(homeUserLocateDetail(35.3, 139.48)).toEqual({
      lat: 35.3,
      lng: 139.48,
    });
    expect(homeUserLocateDetail(35.3, 139.48)).not.toHaveProperty("keepZoom");
    expect(mapSource).toContain("homeUserLocateDetail");
    expect(mapSource).toContain("homeStartupCamera");
    expect(mapSource).toContain("HOME_USER_FLY_ZOOM");
    expect(locateSource).toContain("homeUserLocateDetail");
    expect(mapSource).not.toMatch(/keepZoom:\s*true/);
    expect(locateSource).not.toMatch(/keepZoom:\s*true/);
    const locateButton = mapSource.slice(
      mapSource.indexOf('data-testid="home-my-location"'),
      mapSource.indexOf('className="home-tool home-zoom"'),
    );
    expect(locateButton).toContain("homeUserLocateDetail");
    expect(locateButton).not.toContain("flyToUserRef");
  });
});
