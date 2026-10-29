import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import {
  affiliateProviderForLocale,
  type AffiliateProvider,
} from "~/lib/affiliate/provider";
import {
  getKlookAffiliateId,
  getRakutenAffiliateId,
} from "~/lib/affiliate/config";

export interface AffiliateLinkContext {
  locale: PilgrimageLocale;
  areaLabel: string;
  lat?: number;
  lng?: number;
}

export interface AffiliateLinkOffer {
  provider: AffiliateProvider;
  href: string;
  linkType: "hotel" | "tour";
}

function klookLocalePath(locale: PilgrimageLocale) {
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

function buildRakutenTravelUrl(input: {
  areaLabel: string;
  lat?: number;
  lng?: number;
  affiliateId: string;
}) {
  const query = searchQuery(input.areaLabel, input.lat, input.lng);
  const destination = new URL("https://travel.rakuten.co.jp/HOTEL/search/");
  if (query) destination.searchParams.set("f_daihyo", query);
  destination.searchParams.set("f_target", "1");
  if (input.lat !== undefined && input.lng !== undefined) {
    destination.searchParams.set("f_lat", String(input.lat));
    destination.searchParams.set("f_lng", String(input.lng));
  }

  const wrapped = new URL(
    `https://hb.afl.rakuten.co.jp/hgc/${encodeURIComponent(input.affiliateId)}/`,
  );
  wrapped.searchParams.set("pc", destination.toString());
  return wrapped.toString();
}

function buildKlookUrl(input: {
  locale: PilgrimageLocale;
  areaLabel: string;
  lat?: number;
  lng?: number;
  affiliateId: string;
}) {
  const query = searchQuery(input.areaLabel, input.lat, input.lng);
  const pathLocale = klookLocalePath(input.locale);
  const destination = new URL(
    `https://www.klook.com/${pathLocale}/search/result/`,
  );
  if (query) destination.searchParams.set("query", query);
  if (input.lat !== undefined && input.lng !== undefined) {
    destination.searchParams.set("latitude", String(input.lat));
    destination.searchParams.set("longitude", String(input.lng));
  }
  destination.searchParams.set("aid", input.affiliateId);
  return destination.toString();
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
      affiliateId,
    });
    return [{ provider, href, linkType: "hotel" }];
  }

  const affiliateId = getKlookAffiliateId();
  if (!affiliateId) return [];
  const href = buildKlookUrl({
    locale: context.locale,
    areaLabel: context.areaLabel,
    lat: context.lat,
    lng: context.lng,
    affiliateId,
  });
  return [{ provider, href, linkType: "tour" }];
}
