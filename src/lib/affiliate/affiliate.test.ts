import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("~/lib/affiliate/allowlist", () => ({
  isAffiliateAllowlisted: vi.fn(() => false),
}));

import { isAffiliateAllowlisted } from "~/lib/affiliate/allowlist";
import {
  getKlookAffiliateId,
  getRakutenAffiliateId,
  isAffiliateFeatureEnabled,
  shouldRenderAffiliateBlock,
} from "~/lib/affiliate/config";
import { resolveKlookContentPath } from "~/lib/affiliate/klook-targets";
import {
  AFFILIATE_BLOCK_MIN_HEIGHT,
  resolveAffiliatePage,
} from "~/lib/affiliate/resolve";
import {
  buildAffiliateLinks,
  buildKlookDestinationUrl,
  buildKlookTrackedUrl,
  buildRakutenTrackedUrl,
  klookLocalePath,
} from "~/lib/affiliate/urls";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";

const mockedAllowlist = vi.mocked(isAffiliateAllowlisted);
const KLOOK_AID = "141236";
const RAKUTEN_AID = "58ec3be6.d1d6c631.58ec3be7.5408d7db";
const KAMAKURA_RAKUTEN_PC =
  "https://travel.rakuten.co.jp/HOTEL/search/?f_daihyo=鎌倉&f_target=1";
const KAMAKURA_TOUR_PATH =
  "activity/25457-kamakura-enoshima-day-tour-tokyo/";

describe("affiliate gating", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockedAllowlist.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off by default and renders nothing", () => {
    expect(isAffiliateFeatureEnabled()).toBe(false);
    expect(shouldRenderAffiliateBlock({ spotId: "anitabi_1_x" })).toBe(false);
    expect(
      resolveAffiliatePage({
        pageType: "spot",
        locale: "ja",
        spotId: "anitabi_1_x",
        locationSlug: "kamakura-kanagawa",
        areaLabel: "Tokyo",
        lat: 35.6,
        lng: 139.7,
      }),
    ).toBeNull();
  });

  it("renders Rakuten when env and allowlist are on", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "rakuten-test-id");
    vi.stubEnv("KLOOK_AFFILIATE_ID", KLOOK_AID);
    mockedAllowlist.mockReturnValue(true);

    const jaLinks = buildAffiliateLinks({
      locale: "ja",
      areaLabel: "宇治市",
      lat: 34.89,
      lng: 135.8,
      locationSlug: "uji-kyoto",
    });
    expect(jaLinks).toHaveLength(1);
    expect(jaLinks[0]?.provider).toBe("rakuten_travel");
    expect(jaLinks[0]?.href).toContain(
      "https://hb.afl.rakuten.co.jp/hgc/rakuten-test-id/",
    );
  });

  it("renders nothing when affiliate id is missing", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    mockedAllowlist.mockReturnValue(true);

    expect(getRakutenAffiliateId()).toBeUndefined();
    expect(getKlookAffiliateId()).toBeUndefined();
    expect(
      buildAffiliateLinks({
        locale: "ja",
        areaLabel: "Tokyo",
        locationSlug: "kamakura-kanagawa",
      }),
    ).toEqual([]);
    expect(
      buildAffiliateLinks({
        locale: "en",
        areaLabel: "Kamakura",
        locationSlug: "kamakura-kanagawa",
      }),
    ).toEqual([]);
  });
});

describe("Rakuten tracked URLs", () => {
  beforeEach(() => {
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", RAKUTEN_AID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the confirmed hgc redirect with encoded pc for Kamakura", () => {
    const links = buildAffiliateLinks({
      locale: "ja",
      areaLabel: "鎌倉市",
      locationSlug: "kamakura-kanagawa",
    });
    expect(links).toHaveLength(1);
    const href = links[0]?.href;
    expect(href).toBe(
      buildRakutenTrackedUrl({
        affiliateId: RAKUTEN_AID,
        pcUrl: KAMAKURA_RAKUTEN_PC,
      }),
    );
    expect(href).toBe(
      `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AID}/?pc=${encodeURIComponent(KAMAKURA_RAKUTEN_PC)}`,
    );
    expect(new URL(href!).searchParams.get("pc")).toBe(KAMAKURA_RAKUTEN_PC);
  });

  it("returns no ja link when RAKUTEN_AFFILIATE_ID is missing", () => {
    vi.unstubAllEnvs();
    expect(
      buildAffiliateLinks({
        locale: "ja",
        areaLabel: "鎌倉市",
        locationSlug: "kamakura-kanagawa",
      }),
    ).toEqual([]);
  });
});

describe("Klook tracked URLs", () => {
  beforeEach(() => {
    vi.stubEnv("KLOOK_AFFILIATE_ID", KLOOK_AID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds redirect URLs with encoded k_site per locale", () => {
    for (const locale of ["zh-tw", "zh", "en"] as const) {
      const href = buildKlookTrackedUrl({
        locale,
        affiliateId: KLOOK_AID,
        contentPath: KAMAKURA_TOUR_PATH,
      });
      expect(href.startsWith("https://affiliate.klook.com/redirect?")).toBe(
        true,
      );
      const params = new URL(href).searchParams;
      expect(params.get("aid")).toBe(KLOOK_AID);
      const kSite = params.get("k_site");
      expect(kSite).toBeTruthy();
      expect(kSite).toBe(
        buildKlookDestinationUrl(locale, KAMAKURA_TOUR_PATH),
      );
      expect(klookLocalePath(locale)).toBe(
        locale === "zh-tw" ? "zh-TW" : locale === "zh" ? "zh-CN" : "en-US",
      );
    }
  });

  it("maps Kamakura and Enoshima regions to the primary tour", () => {
    expect(
      resolveKlookContentPath({ locationSlug: "kamakura-kanagawa" }),
    ).toBe(KAMAKURA_TOUR_PATH);
    expect(
      resolveKlookContentPath({ locationSlug: "fujisawa-kanagawa" }),
    ).toBe(KAMAKURA_TOUR_PATH);
  });

  it("returns no Klook link for unmapped regions", () => {
    expect(resolveKlookContentPath({ locationSlug: "sapporo-hokkaido" })).toBe(
      null,
    );
    expect(
      buildAffiliateLinks({
        locale: "en",
        areaLabel: "Sapporo",
        locationSlug: "sapporo-hokkaido",
      }),
    ).toEqual([]);
  });

  it("hides the block when Klook env is missing even if allowlisted", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    mockedAllowlist.mockReturnValue(true);

    expect(
      resolveAffiliatePage({
        pageType: "location",
        locale: "en",
        locationSlug: "kamakura-kanagawa",
        areaLabel: "Kamakura",
      }),
    ).toBeNull();
  });

  it("resolves allowlisted Kamakura pages to a Klook offer", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    vi.stubEnv("KLOOK_AFFILIATE_ID", KLOOK_AID);
    mockedAllowlist.mockReturnValue(true);

    const resolved = resolveAffiliatePage({
      pageType: "spot",
      locale: "zh-tw",
      spotId: "anitabi_277518_hhm50c87y",
      locationSlug: "kamakura-kanagawa",
      areaLabel: "鎌倉市",
      lat: 35.31,
      lng: 139.55,
    });
    expect(resolved?.offer.provider).toBe("klook");
    expect(resolved?.offer.href).toContain("affiliate.klook.com/redirect");
    expect(
      new URL(resolved!.offer.href).searchParams.get("k_site"),
    ).toBe(
      buildKlookDestinationUrl("zh-tw", KAMAKURA_TOUR_PATH),
    );
  });
});

describe("affiliate marketing copy", () => {
  it("uses final copy without TODO placeholders", () => {
    for (const locale of ["ja", "zh", "zh-tw", "en"] as const) {
      const copy = getPilgrimageCopy(locale);
      expect(copy.affiliateDisclosure).not.toMatch(/TODO/i);
    }
  });
});

describe("affiliate layout constants", () => {
  it("reserves 8.5rem min height on the block", async () => {
    expect(AFFILIATE_BLOCK_MIN_HEIGHT).toBe("8.5rem");
    const source = await import("fs/promises").then((fs) =>
      fs.readFile("src/components/pilgrimage/affiliate-block.tsx", "utf8"),
    );
    expect(source).toContain("min-h-[8.5rem]");
  });
});

describe("affiliate sitemap isolation", () => {
  it("does not import affiliate modules into sitemap lastmod", async () => {
    const source = await import("fs/promises").then((fs) =>
      fs.readFile("scripts/lib/sitemap-lastmod.mjs", "utf8"),
    );
    expect(source).not.toMatch(/affiliate/i);
  });
});
