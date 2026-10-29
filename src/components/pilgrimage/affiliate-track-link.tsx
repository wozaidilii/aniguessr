"use client";

import {
  capturePostHogEvent,
  POSTHOG_EVENTS,
} from "~/lib/posthog";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { type AffiliateProvider } from "~/lib/affiliate/provider";

interface AffiliateTrackLinkProps {
  href: string;
  locale: PilgrimageLocale;
  provider: AffiliateProvider;
  pageType: "spot" | "location";
  spotId?: string;
  locationSlug?: string;
  className?: string;
  children: React.ReactNode;
}

export function AffiliateTrackLink({
  href,
  locale,
  provider,
  pageType,
  spotId,
  locationSlug,
  className,
  children,
}: AffiliateTrackLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() => {
        capturePostHogEvent(POSTHOG_EVENTS.affiliateLinkClicked, {
          locale,
          provider,
          page_type: pageType,
          spot_id: spotId ?? null,
          region_id: locationSlug ?? null,
        });
      }}
    >
      {children}
    </a>
  );
}
