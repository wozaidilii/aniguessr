import "server-only";
import { readFileSync } from "node:fs";
import committedAllowlist from "../../../data/affiliate-allowlist.json";

export interface AffiliateAllowlist {
  spots: string[];
  locations: string[];
}

function loadAllowlist(): AffiliateAllowlist {
  const overridePath = process.env.AFFILIATE_ALLOWLIST_PATH?.trim();
  if (overridePath) {
    return JSON.parse(readFileSync(overridePath, "utf8")) as AffiliateAllowlist;
  }
  return committedAllowlist;
}

export function getAffiliateAllowlist(): AffiliateAllowlist {
  return loadAllowlist();
}

export function isAffiliateAllowlisted(input: {
  spotId?: string;
  locationSlug?: string;
}): boolean {
  const parsed = loadAllowlist();
  if (input.spotId) {
    return parsed.spots.includes(input.spotId);
  }
  if (input.locationSlug) {
    return parsed.locations.includes(input.locationSlug);
  }
  return false;
}
