import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  resolveAffiliatePage,
  type AffiliatePageInput,
} from "~/lib/affiliate/resolve";
import { AffiliateTrackLink } from "~/components/pilgrimage/affiliate-track-link";

export type AffiliateBlockProps = AffiliatePageInput;

function providerSubtext(locale: PilgrimageLocale) {
  return locale === "ja" ? "楽天トラベル" : "Klook";
}

export function AffiliateBlock(props: AffiliateBlockProps) {
  const resolved = resolveAffiliatePage(props);
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
        className="mt-3"
      />
    </section>
  );
}
