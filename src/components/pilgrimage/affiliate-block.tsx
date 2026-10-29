import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { buildAffiliateLinks } from "~/lib/affiliate/urls";
import { shouldRenderAffiliateBlock } from "~/lib/affiliate/config";
import { AffiliateTrackLink } from "~/components/pilgrimage/affiliate-track-link";

interface AffiliateBlockSpotProps {
  pageType: "spot";
  locale: PilgrimageLocale;
  spotId: string;
  areaLabel: string;
  lat: number;
  lng: number;
}

interface AffiliateBlockLocationProps {
  pageType: "location";
  locale: PilgrimageLocale;
  locationSlug: string;
  areaLabel: string;
  lat?: number;
  lng?: number;
}

export type AffiliateBlockProps =
  | AffiliateBlockSpotProps
  | AffiliateBlockLocationProps;

export function AffiliateBlock(props: AffiliateBlockProps) {
  const allowlistKey =
    props.pageType === "spot"
      ? { spotId: props.spotId }
      : { locationSlug: props.locationSlug };

  if (!shouldRenderAffiliateBlock(allowlistKey)) return null;

  const offers = buildAffiliateLinks({
    locale: props.locale,
    areaLabel: props.areaLabel,
    lat: props.lat,
    lng: props.lng,
  });
  if (offers.length === 0) return null;

  const copy = getPilgrimageCopy(props.locale);

  return (
    <section
      className="mt-6 min-h-[7.5rem] rounded-xl border border-white/10 bg-white/[0.03] p-4"
      data-testid="affiliate-block"
      aria-labelledby="affiliate-block-heading"
    >
      <p className="text-[11px] leading-5 text-pink-100/55">
        {copy.affiliateDisclosure}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h3
          id="affiliate-block-heading"
          className="text-xs font-black tracking-[0.14em] text-cyan-100/80 uppercase"
        >
          {copy.affiliateTitle}
        </h3>
        <span
          className="rounded border border-pink-100/25 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-pink-100/70"
          aria-label={copy.affiliatePrLabel}
        >
          {copy.affiliatePrLabel}
        </span>
      </div>
      <ul className="mt-3 grid gap-2">
        {offers.map((offer) => (
          <li key={`${offer.provider}-${offer.linkType}`}>
            <AffiliateTrackLink
              href={offer.href}
              locale={props.locale}
              provider={offer.provider}
              pageType={props.pageType}
              spotId={props.pageType === "spot" ? props.spotId : undefined}
              locationSlug={
                props.pageType === "location" ? props.locationSlug : undefined
              }
              className="inline-flex text-sm font-bold text-cyan-100 underline-offset-2 hover:text-cyan-50 hover:underline"
            >
              {offer.linkType === "hotel"
                ? copy.affiliateHotelLink
                : copy.affiliateTourLink}
            </AffiliateTrackLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
