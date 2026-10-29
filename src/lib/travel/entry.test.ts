import { describe, expect, it } from "vitest";
import type { NavCatalog } from "~/lib/pilgrimage-nav";
import { resolveTripEntry, removeTripStop } from "./entry";
import { emptyTrip, tripShareUrl, tripStateSchema } from "./state";

const name = { zh: "A", ja: "A", en: "A" };
const catalog: NavCatalog = {
  animes: { a: name },
  spots: [
    { id: "s", subjectId: "a", locationSlug: "town", name, lat: 35, lng: 139 },
  ],
};
const saved = { ...emptyTrip(), days: 7, animeIds: ["a"] };
describe("trip entry and editing", () => {
  it("previews a valid shared trip without replacing the device draft", () => {
    const incoming = { ...emptyTrip(), days: 2, spotIds: ["s"] };
    const hash = new URL(tripShareUrl("https://example.com", "en", incoming))
      .hash;
    const entry = resolveTripEntry(catalog, "", hash, JSON.stringify(saved));
    expect(entry.state).toEqual(incoming);
    expect(entry.saved).toEqual(saved);
    expect(entry.persist).toBe(false);
    expect(entry.notice).toBe("preview");
  });
  it("preserves and displays a valid saved trip for malformed or unknown entry links", () => {
    for (const [search, hash] of [
      ["", "#trip=broken"],
      ["?anime=missing", ""],
      ["?spot=missing", ""],
      ["?area=missing", ""],
    ]) {
      const entry = resolveTripEntry(
        catalog,
        search!,
        hash!,
        JSON.stringify(saved),
      );
      expect(entry.state).toEqual(saved);
      expect(entry.persist).toBe(false);
    }
  });
  it("makes valid contextual entries preview-only and restores ordinary drafts", () => {
    expect(
      resolveTripEntry(catalog, "?spot=s", "", JSON.stringify(saved)),
    ).toMatchObject({ persist: false, state: { spotIds: ["s"] } });
    expect(
      resolveTripEntry(catalog, "", "", JSON.stringify(saved)),
    ).toMatchObject({ persist: true, state: saved });
  });
  it("keeps removal possible after many edits and removes stale visit overrides", () => {
    const state = {
      ...saved,
      excludedIds: Array.from({ length: 180 }, (_, i) => `spot:${i}`),
      spotIds: ["s"],
      visitMinutes: { "spot:s": 90 },
    };
    const removed = removeTripStop(state, "spot:s");
    expect(tripStateSchema.safeParse(removed).success).toBe(true);
    expect(removed.spotIds).toEqual([]);
    expect(removed.excludedIds).toHaveLength(180);
    expect(removed.visitMinutes).toEqual({});
  });
});
