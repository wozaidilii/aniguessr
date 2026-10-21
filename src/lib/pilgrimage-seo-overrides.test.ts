import { describe, expect, it } from "vitest";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { BRAND_NAME } from "~/lib/site-url";

describe("pilgrimage SEO overrides", () => {
  const generated = {
    title: "Fujisawa, Kanagawa anime real-life locations | AniGuessr",
    description: "Generated description",
  };

  it("lets a location slug use a title independent of the admin area", () => {
    const seo = applyPilgrimageSeoOverride(
      "location",
      "fujisawa-kanagawa",
      "en",
      generated,
    );
    expect(seo.title).toBe(
      `Enoshima / 江の島 Real-Life Locations | ${BRAND_NAME}`,
    );
    expect(seo.description).toContain("Enoshima");
  });

  it("leaves unspecified slugs on the generated template", () => {
    expect(
      applyPilgrimageSeoOverride("anime", "240038-example", "en", generated),
    ).toEqual(generated);
    expect(
      applyPilgrimageSeoOverride(
        "location",
        "kamakura-kanagawa",
        "ja",
        generated,
      ),
    ).toEqual(generated);
  });

  it("keeps a generated zh-TW title when the slug has no override", () => {
    const template = {
      title: `鎌倉市 動畫取景地 | ${BRAND_NAME}`,
      description: "鎌倉市 的動畫取景地共 472 處。",
    };
    expect(
      applyPilgrimageSeoOverride(
        "location",
        "kamakura-kanagawa",
        "zh-tw",
        template,
      ),
    ).toEqual(template);
    expect(
      applyPilgrimageSeoOverride("anime", "294993-咒术回战", "zh-tw", template),
    ).toEqual(template);
    expect(
      applyPilgrimageSeoOverride("spot", "anitabi_1", "zh-tw", template),
    ).toEqual(template);
  });

  it("uses the Enoshima title on the Fujisawa zh-TW page", () => {
    const seo = applyPilgrimageSeoOverride(
      "location",
      "fujisawa-kanagawa",
      "zh-tw",
      generated,
    );
    expect(seo.title).toBe(`江之島 / 江の島 動畫取景地 | ${BRAND_NAME}`);
    expect(seo.description).toBe(
      "神奈川縣藤澤市江之島一帶的現實取景地，含座標與場景資訊。",
    );
  });
});
