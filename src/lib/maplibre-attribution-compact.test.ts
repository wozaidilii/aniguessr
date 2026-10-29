import { describe, expect, it } from "vitest";
import { collapseMapLibreAttribution } from "~/lib/maplibre-attribution-compact";

describe("collapseMapLibreAttribution", () => {
  it("removes expanded compact attribution state", () => {
    const classNames = new Set([
      "maplibregl-ctrl-attrib",
      "maplibregl-compact",
      "maplibregl-compact-show",
    ]);
    const attrs: Record<string, string> = { "aria-expanded": "true" };
    const button = {
      setAttribute: (name: string, value: string) => {
        attrs[name] = value;
      },
      getAttribute: (name: string) => attrs[name] ?? null,
    };
    const root = {
      classList: {
        remove: (name: string) => {
          classNames.delete(name);
        },
        contains: (name: string) => classNames.has(name),
      },
      querySelector: (selector: string) =>
        selector === "button" ? button : null,
    };
    const container = {
      querySelector: (selector: string) =>
        selector === ".maplibregl-ctrl-attrib" ? root : null,
    };
    const map = { getContainer: () => container };
    collapseMapLibreAttribution(map as never);
    expect(classNames.has("maplibregl-compact-show")).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
});
