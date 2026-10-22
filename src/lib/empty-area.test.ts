import { describe, expect, it } from "vitest";
import knownSlugs from "~/lib/pilgrimage-known-slugs.json";
import { emptyAreaOutcome, parentAreaSlug } from "~/lib/empty-area";

describe("empty pilgrimage area pages", () => {
  it("has no prefecture parent route, so an empty area is a 404", () => {
    expect(parentAreaSlug("chiba-chiba-12106")).toBeNull();
    expect(knownSlugs.location).not.toContain("chiba");
    expect(knownSlugs.location).not.toContain("kyoto");
    expect(knownSlugs.location).not.toContain("tokyo");
    expect(emptyAreaOutcome("chiba-chiba-12106")).toEqual({
      kind: "not-found",
    });
  });
});
