import { isAffiliateAllowlisted } from "~/lib/affiliate/allowlist";

function normalizeEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function isAffiliateFeatureEnabled() {
  return process.env.AFFILIATE_ENABLED === "true";
}

export function getRakutenAffiliateId() {
  return normalizeEnv(process.env.RAKUTEN_AFFILIATE_ID);
}

export function getKlookAffiliateId() {
  return normalizeEnv(process.env.KLOOK_AFFILIATE_ID);
}

export function shouldRenderAffiliateBlock(input: {
  spotId?: string;
  locationSlug?: string;
}) {
  if (!isAffiliateFeatureEnabled()) return false;
  if (!isAffiliateAllowlisted(input)) return false;
  return true;
}
