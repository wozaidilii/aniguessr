import { describe, expect, it } from "vitest";
import {
  siteNavIsCurrent,
  siteNavModel,
  plannerLocaleSuffix,
} from "~/lib/site-nav";

describe("site nav", () => {
  it("preserves planner previews across locales without carrying unrelated query data", () => {
    expect(
      plannerLocaleSuffix(
        "/zh/pilgrimage/planner",
        "?spot=s&tracking=secret",
        "#trip=x",
      ),
    ).toBe("?spot=s#trip=x");
    expect(plannerLocaleSuffix("/en/pilgrimage/planner", "", "#trip=x")).toBe(
      "#trip=x",
    );
    expect(plannerLocaleSuffix("/en/pilgrimage/planner", "", "#other")).toBe(
      "",
    );
    expect(plannerLocaleSuffix("/en", "?spot=s", "#trip=x")).toBe("");
  });
  it("keeps homepage hashes local and points the logo at /{locale}", () => {
    const nav = siteNavModel("/zh", "zh");
    expect(nav.home).toBe("/zh");
    expect(nav.links.map((link) => link.href)).toEqual([
      "/zh/pilgrimage/anime",
      "/zh/pilgrimage/locations",
      "/zh/pilgrimage/planner",
      "#game",
      "#rank",
    ]);
    expect(nav.languages.map((item) => item.href)).toEqual([
      "/ja",
      "/en",
      "/zh",
      "/zh-tw",
    ]);
  });

  it("keeps the same pilgrimage page when the language changes", () => {
    const nav = siteNavModel("/zh/pilgrimage/anime", "zh");
    expect(nav.home).toBe("/zh");
    expect(nav.links.find((link) => link.id === "game")?.href).toBe("/zh#game");
    expect(nav.links.find((link) => link.id === "rank")?.href).toBe("/zh#rank");
    expect(nav.languages.find((item) => item.locale === "ja")?.href).toBe(
      "/ja/pilgrimage/anime",
    );
    expect(nav.languages.find((item) => item.locale === "zh-tw")?.href).toBe(
      "/zh-tw/pilgrimage/anime",
    );
    expect(
      siteNavIsCurrent("/zh/pilgrimage/anime", "/zh/pilgrimage/anime"),
    ).toBe(true);
    expect(
      siteNavIsCurrent("/zh/pilgrimage/anime/slug", "/zh/pilgrimage"),
    ).toBe(false);
    expect(
      siteNavIsCurrent("/zh-tw/pilgrimage/spots/spot-a", "/zh-tw/pilgrimage"),
    ).toBe(true);
  });
});
