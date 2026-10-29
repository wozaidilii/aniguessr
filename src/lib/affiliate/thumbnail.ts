import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";

/** Pilot region slugs on the affiliate allowlist (Designer spec §9.2). */
export const AFFILIATE_THUMBNAIL_LOCATION_SLUGS = [
  "kamakura-kanagawa",
  "fujisawa-kanagawa",
  "shibuya-tokyo",
  "kyoto-kyoto",
] as const;

export type AffiliateThumbnailRegion =
  (typeof AFFILIATE_THUMBNAIL_LOCATION_SLUGS)[number];

const THUMBNAIL_FILES: Record<AffiliateThumbnailRegion, string> = {
  "kamakura-kanagawa": "kamakura.webp",
  "fujisawa-kanagawa": "fujisawa.webp",
  "shibuya-tokyo": "shibuya.webp",
  "kyoto-kyoto": "kyoto.webp",
};

const ALT_BY_REGION: Record<
  AffiliateThumbnailRegion,
  Record<PilgrimageLocale, string>
> = {
  "kamakura-kanagawa": {
    ja: "鎌倉",
    en: "Kamakura",
    zh: "镰仓",
    "zh-tw": "鎌倉",
  },
  "fujisawa-kanagawa": {
    ja: "江の島",
    en: "Enoshima",
    zh: "江之岛",
    "zh-tw": "江之島",
  },
  "shibuya-tokyo": {
    ja: "渋谷",
    en: "Shibuya",
    zh: "涩谷",
    "zh-tw": "澀谷",
  },
  "kyoto-kyoto": {
    ja: "京都",
    en: "Kyoto",
    zh: "京都",
    "zh-tw": "京都",
  },
};

export interface AffiliateThumbnail {
  src: string;
  alt: string;
  region: AffiliateThumbnailRegion;
}

export function isAffiliateThumbnailRegion(
  locationSlug: string,
): locationSlug is AffiliateThumbnailRegion {
  return (AFFILIATE_THUMBNAIL_LOCATION_SLUGS as readonly string[]).includes(
    locationSlug,
  );
}

/** Returns a self-hosted thumbnail for the four pilot regions; otherwise null (B-version icon). */
export function resolveAffiliateThumbnail(
  locationSlug: string,
  locale: PilgrimageLocale,
): AffiliateThumbnail | null {
  if (!isAffiliateThumbnailRegion(locationSlug)) return null;
  return {
    region: locationSlug,
    src: `/images/affiliate/${THUMBNAIL_FILES[locationSlug]}`,
    alt: ALT_BY_REGION[locationSlug][locale],
  };
}
