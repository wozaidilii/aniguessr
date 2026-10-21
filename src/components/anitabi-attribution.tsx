import { ANITABI_SITE, CC_BY_NC_SA_4_URL } from "~/lib/pilgrimage-nav";

/**
 * One attribution line for pilgrimage pages and the homepage footer slot.
 * Import this component in both places. Do not copy the sentence elsewhere.
 *
 * Default is on. To remove the line everywhere, set SHOW_ANITABI_ATTRIBUTION
 * to false, or delete this file and every <AnitabiAttribution />.
 */
export const SHOW_ANITABI_ATTRIBUTION = true;

export type AnitabiAttributionLocale = "zh" | "ja" | "en" | "zh-tw";

/** Sentence parts around the two linked names. Order is lead + anitabi + mid + license + tail. */
const ATTRIBUTION_COPY: Record<
  AnitabiAttributionLocale,
  { lead: string; mid: string; tail: string }
> = {
  zh: {
    lead: "部分地点数据来自 ",
    mid: "，经修改后使用，采用 ",
    tail: " 授权",
  },
  "zh-tw": {
    lead: "部分地點資料來自 ",
    mid: "，經修改後使用，採用 ",
    tail: " 授權",
  },
  ja: {
    lead: "一部のスポット情報は ",
    mid: " のデータを改変して使用しています（",
    tail: "）。",
  },
  en: {
    lead: "Some location data is adapted from ",
    mid: " and used under ",
    tail: ".",
  },
};

const linkClass =
  "underline decoration-current/40 underline-offset-2 hover:opacity-80";

export function AnitabiAttribution({
  locale,
  className,
}: {
  locale: AnitabiAttributionLocale;
  className?: string;
}) {
  if (!SHOW_ANITABI_ATTRIBUTION) return null;
  const copy = ATTRIBUTION_COPY[locale];
  return (
    <p
      className={`text-xs leading-4 text-[var(--dark-text-secondary)] ${className ?? ""}`}
    >
      {copy.lead}
      <a
        href={ANITABI_SITE}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        anitabi
      </a>
      {copy.mid}
      <a
        href={CC_BY_NC_SA_4_URL}
        target="_blank"
        rel="license noopener noreferrer"
        className={linkClass}
      >
        CC BY-NC-SA 4.0
      </a>
      {copy.tail}
    </p>
  );
}
