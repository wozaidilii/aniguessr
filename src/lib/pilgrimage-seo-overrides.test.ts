import { describe, expect, it } from "vitest";
import { applyPilgrimageSeoOverride } from "~/lib/pilgrimage-seo-overrides";
import { BRAND_NAME } from "~/lib/site-url";

describe("pilgrimage SEO overrides", () => {
  const generated = {
    title: "Fujisawa, Kanagawa anime real life locations | AniGuessr",
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
      `Enoshima / 江の島 Real Life Locations | ${BRAND_NAME}`,
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
});
