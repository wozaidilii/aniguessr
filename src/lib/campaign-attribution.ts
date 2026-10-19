const STORAGE_KEY = "aniguessr_first_touch_utm";
const MAX_VALUE_LENGTH = 120;

export interface CampaignTouch {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

function cleanUtm(value: string | null): string {
  return (value ?? "").trim().slice(0, MAX_VALUE_LENGTH);
}

export function readUtmFromSearch(search: string): CampaignTouch | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const touch: CampaignTouch = {
    utm_source: cleanUtm(params.get("utm_source")),
    utm_medium: cleanUtm(params.get("utm_medium")),
    utm_campaign: cleanUtm(params.get("utm_campaign")),
  };
  if (!touch.utm_source && !touch.utm_medium && !touch.utm_campaign) {
    return null;
  }
  return touch;
}

function readStoredTouch(): CampaignTouch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<CampaignTouch>;
    const touch: CampaignTouch = {
      utm_source: cleanUtm(record.utm_source ?? null),
      utm_medium: cleanUtm(record.utm_medium ?? null),
      utm_campaign: cleanUtm(record.utm_campaign ?? null),
    };
    if (!touch.utm_source && !touch.utm_medium && !touch.utm_campaign) {
      return null;
    }
    return touch;
  } catch {
    return null;
  }
}

/**
 * Remember the first campaign that brought this browser to the site.
 * Later pages drop the query string; game events still read this record.
 */
export function captureFirstTouch(search: string): {
  first: CampaignTouch | null;
  current: CampaignTouch | null;
} {
  const current = readUtmFromSearch(search);
  if (typeof window === "undefined") return { first: current, current };
  let first = readStoredTouch();
  if (!first && current) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Ignore private-mode storage failures.
    }
    first = current;
  }
  return { first, current };
}

export function campaignProperties(
  touch: CampaignTouch | null,
): Record<string, string> {
  if (!touch) return {};
  return Object.fromEntries(
    (Object.entries(touch) as Array<[keyof CampaignTouch, string]>).filter(
      ([, value]) => value.length > 0,
    ),
  );
}

export function readFirstTouchProperties(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const { first } = captureFirstTouch(window.location.search);
  return campaignProperties(first);
}
