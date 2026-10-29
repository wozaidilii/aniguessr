import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  resolveAffiliatePage,
  type AffiliatePageInput,
} from "~/lib/affiliate/resolve";
import { resolveAffiliateThumbnail } from "~/lib/affiliate/thumbnail";
import { AffiliateTrackLink } from "~/components/pilgrimage/affiliate-track-link";

export type AffiliateBlockProps = AffiliatePageInput & {
  /**
   * Screenshot / QA only: force B-version icon row on pilot pages.
   * Never set in production routes.
   */
  forceLinkVisualFallback?: boolean;
};

function providerSubtext(locale: PilgrimageLocale) {
  return locale === "ja" ? "楽天トラベル" : "Klook";
}

export function AffiliateBlock(props: AffiliateBlockProps) {
  const { forceLinkVisualFallback, ...pageInput } = props;
  const resolved = resolveAffiliatePage(pageInput);
  if (!resolved) return null;

  const { offer, input } = resolved;
  const copy = getPilgrimageCopy(input.locale);
  const mainText =
    offer.linkType === "hotel"
      ? copy.affiliateHotelLink
      : copy.affiliateTourLink;
  const subText = providerSubtext(input.locale);
  const title =
    input.pageType === "location"
      ? copy.affiliateTitleLocation
      : copy.affiliateTitle;
  const locationSlug =
    input.pageType === "spot" ? input.locationSlug : input.locationSlug;
  const forceFallback =
    forceLinkVisualFallback === true ||
    process.env.AFFILIATE_FORCE_LINK_FALLBACK === "1";
  const thumbnail = forceFallback
    ? null
    : resolveAffiliateThumbnail(locationSlug, input.locale);

  return (
    <section
      className="mt-4 min-h-[8.5rem] rounded-2xl border border-[#E7E3DC] bg-white p-5"
      data-testid="affiliate-block"
      aria-labelledby="affiliate-block-heading"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          id="affiliate-block-heading"
          className="text-[15px] leading-[22px] font-extrabold text-[#1F2430]"
        >
          {title}
        </h3>
        <span className="rounded border border-[#B9BDC6] px-1.5 py-0.5 text-[11px] leading-4 font-bold tracking-[0.04em] text-[#646B79]">
          {copy.affiliatePrLabel}
        </span>
      </div>

      <AffiliateTrackLink
        href={offer.href}
        locale={input.locale}
        provider={offer.provider}
        pageType={input.pageType}
        linkType={offer.linkType}
        mainText={mainText}
        subText={subText}
        spotId={input.pageType === "spot" ? input.spotId : undefined}
        locationSlug={
          input.pageType === "location" ? input.locationSlug : undefined
        }
        thumbnail={thumbnail}
        className="mt-3"
      />
    </section>
  );
}
