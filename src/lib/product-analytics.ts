import { track } from "@vercel/analytics";
import {
  campaignProperties,
  captureFirstTouch,
  readFirstTouchProperties,
  type CampaignTouch,
} from "~/lib/campaign-attribution";

export const PRODUCT_EVENTS = {
  campaignVisit: "campaign_visit",
  gameStarted: "game_started",
  gameFinished: "game_finished",
  battleStarted: "battle_started",
} as const;

type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

type AnalyticsValue = string | number | boolean | null;

function trackSafe(
  name: ProductEventName,
  properties: Record<string, AnalyticsValue | undefined>,
) {
  if (typeof window === "undefined") return;
  const compact = Object.fromEntries(
    Object.entries(properties).filter(
      (entry): entry is [string, AnalyticsValue] => entry[1] !== undefined,
    ),
  );
  try {
    track(name, compact);
  } catch {
    // Analytics must never block gameplay.
  }
}

const VISIT_SESSION_PREFIX = "aniguessr_campaign_visit:";

function visitKey(touch: CampaignTouch): string {
  return `${VISIT_SESSION_PREFIX}${touch.utm_source}|${touch.utm_medium}|${touch.utm_campaign}`;
}

/**
 * One custom event per browser session for a landing campaign.
 * Vercel page views do not break down by UTM, so this is the channel slice.
 */
export function captureCampaignVisit(pathname: string, search: string) {
  const { current } = captureFirstTouch(search);
  if (!current || typeof window === "undefined") return;
  try {
    const key = visitKey(current);
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Still emit the event if session storage is unavailable.
  }
  trackSafe(PRODUCT_EVENTS.campaignVisit, {
    path: pathname,
    ...campaignProperties(current),
  });
}

export function trackProductEvent(
  name: Exclude<ProductEventName, "campaign_visit">,
  properties: Record<string, AnalyticsValue | undefined> = {},
) {
  trackSafe(name, {
    ...readFirstTouchProperties(),
    ...properties,
  });
}
