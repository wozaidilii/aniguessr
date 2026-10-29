import committedAllowlist from "../../../data/affiliate-allowlist.json";

interface AffiliateAllowlist {
  spots: string[];
  locations: string[];
}

const allowlist = committedAllowlist as AffiliateAllowlist;

/** Allowlisted affiliate pilot pages must not show anime screenshots or spot OG cards. */
export function shouldSuppressAffiliatePilotScreenshots(input: {
  spotId?: string;
  locationSlug?: string;
}): boolean {
  if (input.spotId && allowlist.spots.includes(input.spotId)) return true;
  if (
    input.locationSlug &&
    allowlist.locations.includes(input.locationSlug)
  ) {
    return true;
  }
  return false;
}
