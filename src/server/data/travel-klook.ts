import "server-only";
import {
  getKlookAffiliateId,
  isAffiliateFeatureEnabled,
} from "~/lib/affiliate/config";
import { getKlookTargetsFile } from "~/lib/affiliate/klook-targets";
import {
  buildKlookDestinationUrl,
  buildKlookTrackedUrl,
} from "~/lib/affiliate/urls";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import type { KlookLinks } from "~/lib/travel/types";

/** Planner destinations are curated separately from the legacy spot-page allowlist. */
export function getTravelKlookLinks(locale: PilgrimageLocale): KlookLinks {
  const affiliateId = isAffiliateFeatureEnabled()
    ? getKlookAffiliateId()
    : undefined;
  const paths = {
    ...getKlookTargetsFile().destinations,
    osaka: "destination/c29-osaka/",
    japan: "destination/co1012-japan/",
    global: "",
  };
  return Object.fromEntries(
    Object.entries(paths).map(([region, contentPath]) => [
      region,
      {
        href: affiliateId
          ? buildKlookTrackedUrl({ locale, affiliateId, contentPath })
          : buildKlookDestinationUrl(locale, contentPath),
        sponsored: !!affiliateId,
      },
    ]),
  );
}
