import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  affiliateProviderForLocale,
  type AffiliateProvider,
} from "~/lib/affiliate/provider";
import {
  getKlookAffiliateId,
  getRakutenAffiliateId,
} from "~/lib/affiliate/config";
import { resolveKlookContentPath } from "~/lib/affiliate/klook-targets";
import { resolveRakutenTravelDestination } from "~/lib/affiliate/rakuten-targets";

export interface AffiliateLinkContext {
  locale: PilgrimageLocale;
  areaLabel: string;
  lat?: number;
  lng?: number;
  spotId?: string;
  locationSlug?: string;
}

export interface AffiliateLinkOffer {
  provider: AffiliateProvider;
  href: string;
  linkType: "hotel" | "tour";
}

export function klookLocalePath(locale: PilgrimageLocale) {
  if (locale === "zh-tw") return "zh-TW";
  if (locale === "zh") return "zh-CN";
  return "en-US";
}

function searchQuery(areaLabel: string, lat?: number, lng?: number) {
  const area = areaLabel.trim();
  if (area) return area;
  if (lat !== undefined && lng !== undefined) {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }
  return "";
}

function buildRakutenSearchUrl(input: {
  areaLabel: string;
  lat?: number;
  lng?: number;
}) {
  const query = searchQuery(input.areaLabel, input.lat, input.lng);
  const destination = new URL("https://travel.rakuten.co.jp/HOTEL/search/");
  if (query) destination.searchParams.set("f_daihyo", query);
  destination.searchParams.set("f_target", "1");
  if (input.lat !== undefined && input.lng !== undefined) {
    destination.searchParams.set("f_lat", String(input.lat));
    destination.searchParams.set("f_lng", String(input.lng));
  }
  return destination.toString();
}

/** Confirmed affiliate wrapper: hgc/{id}/?pc={encoded travel.rakuten.co.jp URL} */
export function buildRakutenTrackedUrl(input: {
  affiliateId: string;
  pcUrl: string;
}) {
  const redirect = new URL(
    `https://hb.afl.rakuten.co.jp/hgc/${input.affiliateId}/`,
  );
  redirect.searchParams.set("pc", input.pcUrl);
  return redirect.toString();
}

function buildRakutenTravelUrl(input: {
  areaLabel: string;
  lat?: number;
  lng?: number;
  locationSlug?: string;
  affiliateId: string;
}) {
  const pcUrl = resolveRakutenTravelDestination({
    areaLabel: input.areaLabel,
    lat: input.lat,
    lng: input.lng,
    locationSlug: input.locationSlug,
  });

  return buildRakutenTrackedUrl({
    affiliateId: input.affiliateId,
    pcUrl,
  });
}

export function buildKlookDestinationUrl(
  locale: PilgrimageLocale,
  contentPath: string,
) {
  const normalized = contentPath.replace(/^\//, "");
  const pathLocale = klookLocalePath(locale);
  const url = `https://www.klook.com/${pathLocale}/${normalized}`;
  return url.endsWith("/") ? url : `${url}/`;
}

export function buildKlookTrackedUrl(input: {
  locale: PilgrimageLocale;
  affiliateId: string;
  contentPath: string;
}) {
  const destination = buildKlookDestinationUrl(input.locale, input.contentPath);
  const redirect = new URL("https://affiliate.klook.com/redirect");
  redirect.searchParams.set("aid", input.affiliateId);
  redirect.searchParams.set("k_site", destination);
  return redirect.toString();
}

export function buildAffiliateLinks(
  context: AffiliateLinkContext,
): AffiliateLinkOffer[] {
  const provider = affiliateProviderForLocale(context.locale);
  if (!provider) return [];

  if (provider === "rakuten_travel") {
    const affiliateId = getRakutenAffiliateId();
    if (!affiliateId) return [];
    const href = buildRakutenTravelUrl({
      areaLabel: context.areaLabel,
      lat: context.lat,
      lng: context.lng,
      locationSlug: context.locationSlug,
      affiliateId,
    });
    return [{ provider, href, linkType: "hotel" }];
  }

  const affiliateId = getKlookAffiliateId();
  if (!affiliateId) return [];

  const contentPath = resolveKlookContentPath({
    spotId: context.spotId,
    locationSlug: context.locationSlug,
  });
  if (!contentPath) return [];

  const href = buildKlookTrackedUrl({
    locale: context.locale,
    affiliateId,
    contentPath,
  });

  return [{ provider: "klook", href, linkType: "tour" }];
}
