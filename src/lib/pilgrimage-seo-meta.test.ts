import { describe, expect, it } from "vitest";
import { ANIME_LOCALES } from "~/lib/anime-locale";
import {
  assignSpotSeoVariants,
  buildSpotSeo,
  PILGRIMAGE_SEO_TEMPLATES,
  type SpotSeoFields,
} from "~/lib/pilgrimage-seo-meta";
import { BRAND_NAME } from "~/lib/site-url";

function spot(
  partial: Partial<SpotSeoFields> & Pick<SpotSeoFields, "id">,
): SpotSeoFields {
  return {
    anime: "Clannad",
    place: "CLANNAD Slope",
    area: "Tokyo",
    episode: "",
    scene: "",
    ...partial,
  };
}

describe("pilgrimage seo templates", () => {
  it("keeps the brand suffix in every locale template", () => {
    for (const locale of ANIME_LOCALES) {
      const templates = PILGRIMAGE_SEO_TEMPLATES[locale];
      expect(templates.spotTitle).toContain("{brand}");
      expect(templates.hubTitle).toContain("{brand}");
      expect(buildSpotSeo(locale, spot({ id: "a" }), "base").title).toContain(
        BRAND_NAME,
      );
    }
  });

  it("uses the filming-location pattern and disambiguates collisions", () => {
    const shared = [
      spot({ id: "only", anime: "Only", place: "Bridge" }),
      spot({
        id: "ep-1",
        episode: "Episode 1",
        scene: "Sunset",
      }),
      spot({
        id: "ep-2",
        episode: "Episode 2",
        scene: "Rain",
      }),
      spot({
        id: "same-ep-a",
        anime: "K-On!",
        place: "School",
        episode: "Episode 4",
        scene: "Club room",
      }),
      spot({
        id: "same-ep-b",
        anime: "K-On!",
        place: "School",
        episode: "Episode 4",
        scene: "Stairwell",
      }),
    ];
    const variants = assignSpotSeoVariants(shared);
    expect(variants.get("only")).toBe("base");
    expect(variants.get("ep-1")).toBe("episode");
    expect(variants.get("ep-2")).toBe("episode");
    expect(variants.get("same-ep-a")).toBe("scene");
    expect(variants.get("same-ep-b")).toBe("scene");

    const titles = shared.map(
      (item) => buildSpotSeo("en", item, variants.get(item.id) ?? "id").title,
    );
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles[0]).toBe(`Only Bridge real-life location | ${BRAND_NAME}`);
    expect(buildSpotSeo("ja", shared[0]!, "base").title).toBe(
      `Only Bridge 撮影地 | ${BRAND_NAME}`,
    );
    expect(buildSpotSeo("zh", shared[0]!, "base").title).toBe(
      `Only Bridge 取景地 | ${BRAND_NAME}`,
    );
  });
});
