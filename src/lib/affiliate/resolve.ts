import "server-only";

import { shouldRenderAffiliateBlock } from "~/lib/affiliate/config";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  buildAffiliateLinks,
  type AffiliateLinkOffer,
} from "~/lib/affiliate/urls";

/** Reserved block height at 390px viewport (Designer spec). */
export const AFFILIATE_BLOCK_MIN_HEIGHT = "8.5rem";

interface AffiliateSpotInput {
  pageType: "spot";
  locale: PilgrimageLocale;
  spotId: string;
  areaLabel: string;
  lat: number;
  lng: number;
}

interface AffiliateLocationInput {
  pageType: "location";
  locale: PilgrimageLocale;
  locationSlug: string;
  areaLabel: string;
  lat?: number;
  lng?: number;
}

export type AffiliatePageInput = AffiliateSpotInput | AffiliateLocationInput;

export interface ResolvedAffiliatePage {
  input: AffiliatePageInput;
  offer: AffiliateLinkOffer;
}

function linkContext(input: AffiliatePageInput) {
  return {
    locale: input.locale,
    areaLabel: input.areaLabel,
    lat: input.lat,
    lng: input.lng,
  };
}

export function resolveAffiliatePage(
  input: AffiliatePageInput,
): ResolvedAffiliatePage | null {
  const allowlistKey =
    input.pageType === "spot"
      ? { spotId: input.spotId }
      : { locationSlug: input.locationSlug };

  if (!shouldRenderAffiliateBlock(allowlistKey)) return null;

  const offers = buildAffiliateLinks(linkContext(input));
  const offer = offers[0];
  if (!offer) return null;

  return { input, offer };
}
