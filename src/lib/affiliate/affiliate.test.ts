import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { affiliateProviderForLocale } from "~/lib/affiliate/provider";
import { buildAffiliateLinks } from "~/lib/affiliate/urls";

const mockedAllowlist = vi.mocked(isAffiliateAllowlisted);

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
    expect(buildAffiliateLinks({ locale: "ja", areaLabel: "Tokyo" })).toEqual(
      [],
    );
  });

  it("renders when env and allowlist are on with provider-specific URLs", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    vi.stubEnv("RAKUTEN_AFFILIATE_ID", "rakuten-test-id");
    vi.stubEnv("KLOOK_AFFILIATE_ID", "klook-test-id");
    mockedAllowlist.mockReturnValue(true);

    expect(shouldRenderAffiliateBlock({ spotId: "anitabi_1_x" })).toBe(true);

    const jaLinks = buildAffiliateLinks({
      locale: "ja",
      areaLabel: "宇治市",
      lat: 34.89,
      lng: 135.8,
    });
    expect(jaLinks).toHaveLength(1);
    expect(jaLinks[0]?.provider).toBe("rakuten_travel");
    expect(jaLinks[0]?.href).toContain("rakuten-test-id");
    expect(jaLinks[0]?.href).toContain("travel.rakuten.co.jp");

    const enLinks = buildAffiliateLinks({
      locale: "en",
      areaLabel: "Kyoto",
    });
    expect(enLinks).toHaveLength(1);
    expect(enLinks[0]?.provider).toBe("klook");
    expect(enLinks[0]?.href).toContain("klook.com/en-US/search");
    expect(enLinks[0]?.href).toContain("aid=klook-test-id");

    expect(affiliateProviderForLocale("zh-tw")).toBe("klook");
    expect(buildAffiliateLinks({ locale: "zh-tw", areaLabel: "小樽" })[0]?.href).toContain(
      "/zh-TW/",
    );
    expect(buildAffiliateLinks({ locale: "zh", areaLabel: "小樽" })[0]?.href).toContain(
      "/zh-CN/",
    );
  });

  it("renders nothing when affiliate id is missing", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    mockedAllowlist.mockReturnValue(true);

    expect(getRakutenAffiliateId()).toBeUndefined();
    expect(getKlookAffiliateId()).toBeUndefined();
    expect(
      buildAffiliateLinks({ locale: "ja", areaLabel: "Tokyo" }),
    ).toEqual([]);
    expect(
      buildAffiliateLinks({ locale: "en", areaLabel: "Tokyo" }),
    ).toEqual([]);
  });
});

describe("affiliate link markup contract", () => {
  it("uses sponsored rel attributes on tracked links", async () => {
    const source = await import("fs/promises").then((fs) =>
      fs.readFile("src/components/pilgrimage/affiliate-track-link.tsx", "utf8"),
    );
    expect(source).toContain('rel="sponsored nofollow noopener"');
    expect(source).toContain('target="_blank"');
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
