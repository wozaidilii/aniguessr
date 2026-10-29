import allowlist from "../../../data/affiliate-allowlist.json";

export interface AffiliateAllowlist {
  spots: string[];
  locations: string[];
}

const parsed = allowlist as AffiliateAllowlist;

export function getAffiliateAllowlist(): AffiliateAllowlist {
  return parsed;
}

export function isAffiliateAllowlisted(input: {
  spotId?: string;
  locationSlug?: string;
}): boolean {
  if (input.spotId) {
    return parsed.spots.includes(input.spotId);
  }
  if (input.locationSlug) {
    return parsed.locations.includes(input.locationSlug);
  }
  return false;
}
