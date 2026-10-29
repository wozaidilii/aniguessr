import { describe, expect, it } from "vitest";
import {
  homeLoginHref,
  sanitizeSameOriginReturnPath,
} from "~/lib/home-locale";

describe("sanitizeSameOriginReturnPath", () => {
  it("accepts relative same-origin paths", () => {
    expect(sanitizeSameOriginReturnPath("/zh-tw/pilgrimage/anime", "/zh-tw")).toBe(
      "/zh-tw/pilgrimage/anime",
    );
  });

  it("rejects open redirects", () => {
    expect(sanitizeSameOriginReturnPath("//evil.example/phish", "/zh-tw")).toBe(
      "/zh-tw",
    );
    expect(sanitizeSameOriginReturnPath("https://evil.example", "/ja")).toBe("/ja");
    expect(sanitizeSameOriginReturnPath(null, "/en")).toBe("/en");
  });
});

describe("homeLoginHref", () => {
  it("links zh-tw users to /zh-tw/login on the home page", () => {
    expect(homeLoginHref("zh-tw", "/zh-tw")).toBe("/zh-tw/login");
  });

  it("carries a safe next path for zh-tw off the hub", () => {
    expect(homeLoginHref("zh-tw", "/zh-tw/pilgrimage/spots/anitabi_1")).toBe(
      "/zh-tw/login?next=%2Fzh-tw%2Fpilgrimage%2Fspots%2Fanitabi_1",
    );
  });

  it("does not send ja/en/zh users to simplified login for zh-tw", () => {
    expect(homeLoginHref("ja", "/ja")).toBe("/ja/login");
    expect(homeLoginHref("zh", "/zh")).toBe("/zh/login");
    expect(homeLoginHref("en", "/en")).toBe("/en/login");
  });

  it("sanitizes next on other locales", () => {
    expect(homeLoginHref("ja", "//evil")).toBe("/ja/login");
    expect(homeLoginHref("en", "/en/battle")).toBe(
      "/en/login?next=%2Fen%2Fbattle",
    );
  });
});
