import { afterEach, describe, expect, it } from "vitest";
import {
  captureFirstTouch,
  readUtmFromSearch,
} from "~/lib/campaign-attribution";

describe("campaign attribution", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("reads utm_source, utm_medium, and utm_campaign", () => {
    expect(
      readUtmFromSearch(
        "?utm_source=twitter&utm_medium=social&utm_campaign=launch",
      ),
    ).toEqual({
      utm_source: "twitter",
      utm_medium: "social",
      utm_campaign: "launch",
    });
    expect(readUtmFromSearch("?ref=home")).toBeNull();
  });

  it("persists the first touch and ignores a later campaign", () => {
    const storage = new Map<string, string>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    };

    const first = captureFirstTouch(
      "utm_source=reddit&utm_medium=post&utm_campaign=a",
    );
    const second = captureFirstTouch(
      "utm_source=x&utm_medium=post&utm_campaign=b",
    );
    expect(first.first).toMatchObject({ utm_source: "reddit" });
    expect(second.current).toMatchObject({ utm_source: "x" });
    expect(second.first).toMatchObject({ utm_source: "reddit" });
  });
});
