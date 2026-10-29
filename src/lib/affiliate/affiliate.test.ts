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
import {
  AFFILIATE_BLOCK_MIN_HEIGHT,
  resolveAffiliatePage,
} from "~/lib/affiliate/resolve";
import { buildAffiliateLinks } from "~/lib/affiliate/urls";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";

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
    expect(
      resolveAffiliatePage({
        pageType: "spot",
        locale: "ja",
        spotId: "anitabi_1_x",
        areaLabel: "Tokyo",
        lat: 35.6,
        lng: 139.7,
      }),
    ).toBeNull();
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

    const resolved = resolveAffiliatePage({
      pageType: "spot",
      locale: "ja",
      spotId: "anitabi_1_x",
      areaLabel: "宇治市",
      lat: 34.89,
      lng: 135.8,
    });
    expect(resolved?.offer.linkType).toBe("hotel");

    const enLinks = buildAffiliateLinks({
      locale: "en",
      areaLabel: "Kyoto",
    });
    expect(enLinks).toHaveLength(1);
    expect(enLinks[0]?.provider).toBe("klook");
    expect(enLinks[0]?.href).toContain("klook.com/en-US/search");
    expect(enLinks[0]?.href).toContain("aid=klook-test-id");

    expect(affiliateProviderForLocale("zh-tw")).toBe("klook");
    expect(
      buildAffiliateLinks({ locale: "zh-tw", areaLabel: "小樽" })[0]?.href,
    ).toContain("/zh-TW/");
    expect(
      buildAffiliateLinks({ locale: "zh", areaLabel: "小樽" })[0]?.href,
    ).toContain("/zh-CN/");
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
    expect(
      resolveAffiliatePage({
        pageType: "spot",
        locale: "ja",
        spotId: "anitabi_1_x",
        areaLabel: "Tokyo",
        lat: 35.6,
        lng: 139.7,
      }),
    ).toBeNull();
  });
});

describe("affiliate marketing copy", () => {
  it("uses final copy without TODO placeholders", () => {
    for (const locale of ["ja", "zh", "zh-tw", "en"] as const) {
      const copy = getPilgrimageCopy(locale);
      expect(copy.affiliatePrLabel).toBe("PR");
      expect(copy.affiliateDisclosure).not.toMatch(/TODO/i);
      expect(copy.affiliateTitle).not.toMatch(/TODO/i);
      expect(copy.affiliateTitleLocation).not.toMatch(/TODO/i);
    }
    expect(getPilgrimageCopy("ja").affiliateDisclosure).toContain(
      "アフィリエイトリンク",
    );
  });
});

describe("affiliate layout constants", () => {
  it("reserves 8.5rem min height on the block", async () => {
    expect(AFFILIATE_BLOCK_MIN_HEIGHT).toBe("8.5rem");
    const source = await import("fs/promises").then((fs) =>
      fs.readFile("src/components/pilgrimage/affiliate-block.tsx", "utf8"),
    );
    expect(source).toContain("min-h-[8.5rem]");
    expect(source).toContain("border-[#E7E3DC]");
    expect(source).toContain("bg-white");
  });
});

describe("affiliate link markup contract", () => {
  it("uses sponsored rel attributes on tracked links", async () => {
    const source = await import("fs/promises").then((fs) =>
      fs.readFile("src/components/pilgrimage/affiliate-track-link.tsx", "utf8"),
    );
    expect(source).toContain('rel="sponsored nofollow noopener"');
    expect(source).toContain('target="_blank"');
    expect(source).toContain("aria-label");
  });

  it("renders H1 disclosure only via pilgrimage shell prop", async () => {
    const shell = await import("fs/promises").then((fs) =>
      fs.readFile(
        "src/app/[locale]/pilgrimage/_components/pilgrimage-ui.tsx",
        "utf8",
      ),
    );
    expect(shell).toContain("affiliateDisclosure");
    expect(shell).toContain("affiliate-h1-disclosure");
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
