import { describe, expect, it } from "vitest";
import {
  createGoogleTileLoadCounters,
  GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS,
  isGoogleRoadmapTileErrorMessage,
  recordGoogleTileLoadFailure,
  recordGoogleTileLoadSuccess,
} from "~/lib/google-map-tiles-quota-fallback";

describe("google tile quota fallback counters", () => {
  it("detects google roadmap tile errors in messages", () => {
    expect(isGoogleRoadmapTileErrorMessage("Failed to load tile.googleapis.com/v1/2dtiles/1/2/3")).toBe(true);
    expect(isGoogleRoadmapTileErrorMessage("Source google-roadmap failed")).toBe(true);
    expect(isGoogleRoadmapTileErrorMessage("OpenFreeMap timeout")).toBe(false);
  });

  it("falls back after consecutive tile failures", () => {
    let counters = createGoogleTileLoadCounters();
    const threshold = GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS.consecutiveFailThreshold;
    for (let i = 0; i < threshold - 1; i += 1) {
      const step = recordGoogleTileLoadFailure(counters);
      expect(step.shouldFallback).toBe(false);
      counters = step.counters;
    }
    const last = recordGoogleTileLoadFailure(counters);
    expect(last.shouldFallback).toBe(true);
  });

  it("falls back when more than half of the first batch fails", () => {
    // Consecutive threshold would fire before an 8-tile batch closes if failures are
    // back-to-back; use a high consecutive limit so this case exercises the ratio rule.
    const config = {
      ...GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS,
      consecutiveFailThreshold: 99,
    };
    let counters = createGoogleTileLoadCounters();
    for (let i = 0; i < 3; i += 1) {
      counters = recordGoogleTileLoadSuccess(counters, config).counters;
    }
    for (let i = 0; i < 4; i += 1) {
      const step = recordGoogleTileLoadFailure(counters, config);
      expect(step.shouldFallback).toBe(false);
      counters = step.counters;
    }
    const last = recordGoogleTileLoadFailure(counters, config);
    expect(last.shouldFallback).toBe(true);
    expect(last.counters.batchFailures).toBe(5);
    expect(last.counters.batchAttempts).toBe(8);
  });

  it("does not fall back when successes break the consecutive streak", () => {
    let counters = createGoogleTileLoadCounters();
    for (let i = 0; i < 3; i += 1) {
      counters = recordGoogleTileLoadFailure(counters).counters;
    }
    counters = recordGoogleTileLoadSuccess(counters).counters;
    const step = recordGoogleTileLoadFailure(counters);
    expect(step.counters.consecutiveFailures).toBe(1);
    expect(step.shouldFallback).toBe(false);
  });

  it("closes the batch after enough attempts without triggering fallback", () => {
    let counters = createGoogleTileLoadCounters();
    const { minBatchSize } = GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS;
    for (let i = 0; i < minBatchSize; i += 1) {
      counters = recordGoogleTileLoadSuccess(counters).counters;
    }
    expect(counters.batchClosed).toBe(true);
    const after = recordGoogleTileLoadFailure(counters);
    expect(after.shouldFallback).toBe(false);
  });
});
