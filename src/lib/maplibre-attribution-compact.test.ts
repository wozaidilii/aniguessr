import { describe, expect, it } from "vitest";
import { collapseMapLibreAttribution } from "~/lib/maplibre-attribution-compact";

describe("collapseMapLibreAttribution", () => {
  it("applies MapLibre collapsed compact attribution state", () => {
    const classNames = new Set(["maplibregl-ctrl-attrib"]);
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
    expect(classNames.has("maplibregl-compact-show")).toBe(true);
    expect(openAttr.value).toBeNull();
  });
});
