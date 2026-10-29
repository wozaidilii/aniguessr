"use client";

import {
  capturePostHogEvent,
  POSTHOG_EVENTS,
} from "~/lib/posthog";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { type AffiliateProvider } from "~/lib/affiliate/provider";

const NEW_TAB_ARIA: Record<PilgrimageLocale, string> = {
  ja: "（新しいタブで開きます）",
  zh: "（在新标签页中打开）",
  "zh-tw": "（在新分頁中開啟）",
  en: " (opens in a new tab)",
};

interface AffiliateTrackLinkProps {
  href: string;
  locale: PilgrimageLocale;
  provider: AffiliateProvider;
  pageType: "spot" | "location";
  linkType: "hotel" | "tour";
  mainText: string;
  subText: string;
  spotId?: string;
  locationSlug?: string;
  className?: string;
}

function BedIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] text-[#0C6B66]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M3 12V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
      <path d="M3 12v4h18v-4" />
      <path d="M3 16v2M21 16v2M7 10V8M17 10V8" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] text-[#0C6B66]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <path d="M12 6v12" strokeDasharray="2 3" />
    </svg>
  );
}

export function AffiliateTrackLink({
  href,
  locale,
  provider,
  pageType,
  linkType,
  mainText,
  subText,
  spotId,
  locationSlug,
  className,
}: AffiliateTrackLinkProps) {
  const Icon = linkType === "hotel" ? BedIcon : TicketIcon;

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      aria-label={`${mainText} ${subText}${NEW_TAB_ARIA[locale]}`}
      className={`group flex min-h-14 items-center gap-3 rounded-xl border border-[#E7E3DC] px-3.5 py-2 hover:border-[#C4275F] hover:bg-[#FFF7FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4275F] ${className ?? ""}`}
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F1EC]">
        <Icon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm leading-5 font-bold text-[#1F2430]">
          {mainText}
        </span>
        <span className="block truncate text-xs leading-[18px] text-[#646B79]">
          {subText}
        </span>
      </span>
      <span
        className="shrink-0 text-sm leading-none text-[#9AA0AA]"
        aria-hidden
      >
        ↗
      </span>
    </a>
  );
}
