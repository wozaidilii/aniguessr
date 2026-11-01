import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { haversineMeters } from "./pilgrimage-group.mjs";
import {
  EXISTING_REDIRECT_FLATTEN_SOURCE,
  LOCATION_MIN_TIER_A,
  MERGE_MAX_DISTANCE_M,
  NO_301_DUPLICATES_SOURCE,
  TRAFFIC_MERGE_EXEMPT_SPOT_IDS,
  WORK_MIN_TIER_A,
  annotateSpotIndexQuality,
  annotateWorkAndLocationIndexQuality,
  applySameWorkMerges,
  flattenRedirectChains,
  loadSameWorkMergeMap,
  loadTierASpotIds,
  validateIndexQualityData,
} from "./index-quality.mjs";

describe("index-quality data module", () => {
  it("exposes threshold constants", () => {
    expect(WORK_MIN_TIER_A).toBe(3);
    expect(LOCATION_MIN_TIER_A).toBe(5);
    expect(MERGE_MAX_DISTANCE_M).toBe(30);
  });

  it("loads tier-A and merge map from committed files", async () => {
    const tierA = await loadTierASpotIds();
    const mergeMap = await loadSameWorkMergeMap();
    expect(tierA.size).toBeGreaterThan(0);
    expect(Object.keys(mergeMap).length).toBeGreaterThan(0);
  });

  it("annotates indexable flags from tier-A counts", () => {
    const tierA = new Set(["s1", "s2", "s3", "s4", "s5"]);
    const spots = {
      s1: {
        id: "s1",
        workSubjectId: "w1",
        locationSlug: "loc",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
      s2: {
        id: "s2",
        workSubjectId: "w1",
        locationSlug: "loc",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
      s3: {
        id: "s3",
        workSubjectId: "w1",
        locationSlug: "loc",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
      s4: {
        id: "s4",
        workSubjectId: "w2",
        locationSlug: "loc",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
      s5: {
        id: "s5",
        workSubjectId: "w2",
        locationSlug: "thin",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
      dup: {
        id: "dup",
        workSubjectId: "w1",
        locationSlug: "loc",
        lat: 0,
        lng: 0,
        redirectTo: null,
      },
    };
    const mergeMap = { dup: "s1" };
    validateIndexQualityData(spots, tierA, mergeMap);
    applySameWorkMerges(spots, mergeMap);
    flattenRedirectChains(spots);
    annotateSpotIndexQuality(spots, tierA);
    const animes = [
      { subjectId: "w1", slug: "work-a" },
      { subjectId: "w2", slug: "work-b" },
    ];
    const locations = [
      { slug: "loc", spotCount: 3 },
      { slug: "thin", spotCount: 1 },
    ];
    annotateWorkAndLocationIndexQuality(animes, locations, spots, tierA);
    expect(spots.s1.indexable).toBe(true);
    expect(spots.dup.indexable).toBe(false);
    expect(animes[0].indexable).toBe(true);
    expect(animes[1].indexable).toBe(false);
    expect(locations[0].indexable).toBe(false);
    expect(locations[1].indexable).toBe(false);
  });
});

describe("committed merge map integrity", () => {
  it("has no tier-A merge keys and valid pairs", async () => {
    const tierA = await loadTierASpotIds();
    const mergeMap = await loadSameWorkMergeMap();
    const index = JSON.parse(
      await readFile(
        path.join(process.cwd(), "public/data/seo/index.json"),
        "utf8",
      ),
    );
    const spots = index.spots ?? {};
    for (const key of Object.keys(mergeMap)) {
      expect(tierA.has(key)).toBe(false);
      expect(mergeMap[mergeMap[key]]).toBeUndefined();
      expect(tierA.has(mergeMap[key])).toBe(true);
      expect(TRAFFIC_MERGE_EXEMPT_SPOT_IDS).not.toContain(key);
      const duplicate = spots[key];
      const canonical = spots[mergeMap[key]];
      expect(duplicate).toBeDefined();
      expect(canonical).toBeDefined();
      const dupWork = duplicate.workSubjectId ?? duplicate.subjectId;
      const canonWork = canonical.workSubjectId ?? canonical.subjectId;
      expect(dupWork).toBe(canonWork);
      expect(haversineMeters(duplicate, canonical)).toBeLessThanOrEqual(
        MERGE_MAX_DISTANCE_M,
      );
    }
  });

  it("does not 301 no-301 duplicate ids", async () => {
    const mergeMap = await loadSameWorkMergeMap();
    const blocked = JSON.parse(
      await readFile(
        path.join(process.cwd(), NO_301_DUPLICATES_SOURCE),
        "utf8",
      ),
    );
    const rows = Array.isArray(blocked) ? blocked : Object.values(blocked);
    for (const row of rows) {
      const id =
        typeof row === "string"
          ? row
          : row && typeof row === "object"
            ? row.id
            : null;
      if (!id) continue;
      expect(Object.hasOwn(mergeMap, id)).toBe(false);
    }
  });

  it("matches flattened existing redirects and has no redirect chains", async () => {
    const expected = JSON.parse(
      await readFile(
        path.join(process.cwd(), EXISTING_REDIRECT_FLATTEN_SOURCE),
        "utf8",
      ),
    );
    const redirectMap = JSON.parse(
      await readFile(
        path.join(process.cwd(), "src/lib/pilgrimage-redirect-map.json"),
        "utf8",
      ),
    );
    const mergeMap = await loadSameWorkMergeMap();
    for (const [id, target] of Object.entries(expected)) {
      expect(redirectMap.spots?.[id]).toBe(target);
    }
    for (const key of Object.keys(mergeMap)) {
      expect(redirectMap.spots?.[key]).toBe(mergeMap[key]);
    }
    for (const value of Object.values(redirectMap.spots ?? {})) {
      expect(redirectMap.spots?.[value]).toBeUndefined();
    }
  });
});
