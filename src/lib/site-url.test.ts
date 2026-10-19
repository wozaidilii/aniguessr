import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_URL,
  legacyHostRedirectUrl,
  resolveSiteUrl,
} from "~/lib/site-url";

describe("canonical site origin", () => {
  it("defaults to the Ayiora production domain", () => {
    expect(resolveSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl("")).toBe("https://aniguessr.ayiora.com");
    expect(resolveSiteUrl("   ")).toBe("https://aniguessr.ayiora.com");
  });

  it("uses NEXT_PUBLIC_SITE_URL when it is set", () => {
    expect(resolveSiteUrl("https://preview.example.com/ignored")).toBe(
      "https://preview.example.com",
    );
    expect(resolveSiteUrl("aniguessr.example.com")).toBe(
      "https://aniguessr.example.com",
    );
  });

  it("301 target preserves path and query on the canonical origin", () => {
    expect(
      legacyHostRedirectUrl(
        "aniguessr.loamly.net",
        "/pilgrimage/spots/abc",
        "?utm_source=x",
      ),
    ).toBe("https://aniguessr.ayiora.com/pilgrimage/spots/abc?utm_source=x");
    expect(
      legacyHostRedirectUrl("aniguessr.ayiora.com", "/robots.txt"),
    ).toBeNull();
    expect(legacyHostRedirectUrl("localhost", "/")).toBeNull();
  });
});
