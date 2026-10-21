import { describe, expect, it } from "vitest";
import {
  readHomeOrigin,
  rememberHomeOrigin,
  resetHomeOriginForTests,
} from "~/lib/home-origin";
import { workFocusLngLats } from "~/lib/home-work-focus";

describe("home work focus", () => {
  it("keeps the last origin after the map would have remounted", () => {
    resetHomeOriginForTests();
    expect(readHomeOrigin()).toBeNull();
    rememberHomeOrigin({ lat: 35.68, lng: 139.76 });
    expect(readHomeOrigin()).toEqual({ lat: 35.68, lng: 139.76 });
    rememberHomeOrigin({ lat: Number.NaN, lng: 1 });
    expect(readHomeOrigin()).toEqual({ lat: 35.68, lng: 139.76 });
    resetHomeOriginForTests();
  });

  it("includes the user in the bounds only when a spot is within 30km", () => {
    const origin = { lat: 35.68, lng: 139.76 };
    const near = { lat: 35.7, lng: 139.75 };
    const far = { lat: 34.7, lng: 135.5 };
    expect(workFocusLngLats([near, far], origin)).toEqual([
      [near.lng, near.lat],
      [far.lng, far.lat],
      [origin.lng, origin.lat],
    ]);
    expect(workFocusLngLats([far], origin)).toEqual([[far.lng, far.lat]]);
    expect(workFocusLngLats([near], null)).toEqual([[near.lng, near.lat]]);
  });
});
