"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { captureCampaignVisit } from "~/lib/product-analytics";

/** Records a campaign_visit when the landing URL carries UTM parameters. */
export function CampaignAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    captureCampaignVisit(pathname ?? "/", search);
  }, [pathname, search]);

  return null;
}
