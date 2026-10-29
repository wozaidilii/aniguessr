/** Session flag: Google 2D tiles failed (quota); use Positron for this tab. */
export const GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY =
  "aniguessr.googleMapTilesQuotaFallback.v1";

export const GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS = {
  /** Consecutive failed Google 2D tile loads before fallback. */
  consecutiveFailThreshold: 4,
  /** Minimum tile outcomes in the first batch before ratio is evaluated. */
  minBatchSize: 8,
  /** Fraction of failed tiles in the first batch (strictly greater than). */
  failRatioThreshold: 0.5,
} as const;

export type GoogleTileQuotaFallbackConfig =
  typeof GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS;

export interface GoogleTileLoadCounters {
  batchAttempts: number;
  batchFailures: number;
  consecutiveFailures: number;
  batchClosed: boolean;
}

export function createGoogleTileLoadCounters(): GoogleTileLoadCounters {
  return {
    batchAttempts: 0,
    batchFailures: 0,
    consecutiveFailures: 0,
    batchClosed: false,
  };
}

export function isGoogleRoadmapTileErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("google-roadmap") ||
    lower.includes("2dtiles") ||
    lower.includes("tile.googleapis.com")
  );
}

export function recordGoogleTileLoadSuccess(
  counters: GoogleTileLoadCounters,
  config: GoogleTileQuotaFallbackConfig = GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS,
): { counters: GoogleTileLoadCounters; shouldFallback: boolean } {
  if (counters.batchClosed) {
    return { counters, shouldFallback: false };
  }
  const next: GoogleTileLoadCounters = {
    ...counters,
    batchAttempts: counters.batchAttempts + 1,
    consecutiveFailures: 0,
  };
  if (next.batchAttempts >= config.minBatchSize) {
    next.batchClosed = true;
  }
  return { counters: next, shouldFallback: false };
}

export function recordGoogleTileLoadFailure(
  counters: GoogleTileLoadCounters,
  config: GoogleTileQuotaFallbackConfig = GOOGLE_TILE_QUOTA_FALLBACK_DEFAULTS,
): { counters: GoogleTileLoadCounters; shouldFallback: boolean } {
  const next: GoogleTileLoadCounters = {
    batchAttempts: counters.batchAttempts + 1,
    batchFailures: counters.batchFailures + 1,
    consecutiveFailures: counters.consecutiveFailures + 1,
    batchClosed: counters.batchClosed,
  };

  if (next.consecutiveFailures >= config.consecutiveFailThreshold) {
    return { counters: next, shouldFallback: true };
  }

  if (
    !next.batchClosed &&
    next.batchAttempts >= config.minBatchSize
  ) {
    next.batchClosed = true;
    const ratio = next.batchFailures / next.batchAttempts;
    if (ratio > config.failRatioThreshold) {
      return { counters: next, shouldFallback: true };
    }
  }

  return { counters: next, shouldFallback: false };
}

export function isGoogleMapTilesQuotaFallbackActive(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGoogleMapTilesQuotaFallbackActive(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY, "1");
  } catch {
    // Private mode — fallback still applies for this page load.
  }
}

export function clearGoogleMapTilesQuotaFallbackFlag(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(GOOGLE_MAP_TILES_QUOTA_FALLBACK_KEY);
  } catch {
    // ignore
  }
}
