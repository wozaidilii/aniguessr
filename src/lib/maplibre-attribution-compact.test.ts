import { describe, expect, it } from "vitest";
import { collapseMapLibreAttribution } from "~/lib/maplibre-attribution-compact";

describe("collapseMapLibreAttribution", () => {
  it("removes compact-show and closes details for collapsed pill", () => {
    const classNames = new Set([
      "maplibregl-ctrl-attrib",
      "maplibregl-compact",
      "maplibregl-compact-show",
    ]);
    const openAttr: { value: string | null } = { value: "" };
    const root = {
      classList: {
        add: (name: string) => {
          classNames.add(name);
        },
        remove: (name: string) => {
          classNames.delete(name);
        },
        contains: (name: string) => classNames.has(name),
      },
      removeAttribute: (name: string) => {
        if (name === "open") openAttr.value = null;
      },
      getAttribute: (name: string) =>
        name === "open" ? openAttr.value : null,
      querySelector: () => null,
    };
    const container = {
      querySelector: (selector: string) =>
        selector === ".maplibregl-ctrl-attrib" ? root : null,
    };
    const map = { getContainer: () => container };
    collapseMapLibreAttribution(map as never);
    expect(classNames.has("maplibregl-compact")).toBe(true);
    expect(classNames.has("maplibregl-compact-show")).toBe(false);
    expect(openAttr.value).toBeNull();
  });
});
