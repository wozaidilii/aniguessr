import { describe, expect, it } from "vitest";
import {
  RIGHTS_EMAIL,
  RIGHTS_LOCALES,
  isLocalePrefixedRightsPath,
  rightsBody,
  rightsContactPrefix,
  rightsLinkLabel,
  rightsMailto,
  rightsPath,
} from "~/lib/rights-contact";

describe("rights contact", () => {
  it("publishes the notice and mailto address in every locale", () => {
    expect(RIGHTS_LOCALES).toEqual(["ja", "zh", "zh-tw", "en"]);
    expect(RIGHTS_EMAIL).toBe("support@ayiora.com");
    expect(rightsMailto()).toBe("mailto:support@ayiora.com");
    expect(rightsLinkLabel("ja")).toBe("権利者の方へ");
    expect(rightsLinkLabel("zh")).toBe("致版权方");
    expect(rightsLinkLabel("zh-tw")).toBe("致版權方");
    expect(rightsLinkLabel("en")).toBe("For rights holders");
    expect(rightsPath("ja")).toBe("/ja/rights");
    expect(rightsPath("zh")).toBe("/zh/rights");
    expect(rightsPath("en")).toBe("/en/rights");
    expect(rightsPath("zh-tw")).toBe("/zh-tw/rights");
    expect(rightsContactPrefix("ja")).toBe("連絡先：");
    expect(rightsContactPrefix("zh")).toBe("联系邮箱：");
    expect(rightsContactPrefix("zh-tw")).toBe("聯絡信箱：");
    expect(rightsContactPrefix("en")).toBe("Contact: ");
    expect(rightsBody("ja")).toContain("掲載の停止");
    expect(rightsBody("zh")).toContain("权利人");
    expect(rightsBody("zh-tw")).toContain("權利人");
    expect(rightsBody("en")).toContain("rights holder");

    const published = RIGHTS_LOCALES.map(
      (locale) =>
        `${rightsLinkLabel(locale)}\n${rightsBody(locale)}\n${rightsContactPrefix(locale)}${RIGHTS_EMAIL}`,
    ).join("\n");
    expect(published).not.toContain("kris@");
    expect(published).not.toContain("工作日");
    expect(published).not.toContain("转发");
    expect(published).not.toMatch(/株式会社|有限公司|Inc\.|Ltd\./u);
  });

  it("matches only locale-prefixed rights URLs", () => {
    expect(isLocalePrefixedRightsPath("/ja/rights")).toBe(true);
    expect(isLocalePrefixedRightsPath("/zh/rights")).toBe(true);
    expect(isLocalePrefixedRightsPath("/en/rights")).toBe(true);
    expect(isLocalePrefixedRightsPath("/zh-tw/rights")).toBe(true);
    expect(isLocalePrefixedRightsPath("/en/rights/extra")).toBe(false);
    expect(isLocalePrefixedRightsPath("/en/pilgrimage")).toBe(false);
    expect(isLocalePrefixedRightsPath("/rights")).toBe(false);
  });
});
