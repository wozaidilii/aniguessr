import { describe, expect, it } from "vitest";
import robots from "~/app/robots";

describe("robots.txt", () => {
  it("disallows private prefixes for zh, ja, en, and zh-tw", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule?.disallow;
    const lines = Array.isArray(disallow) ? disallow : disallow ? [disallow] : [];
    expect(lines).toEqual(
      expect.arrayContaining([
        "/battle/",
        "/profile",
        "/onboarding",
        "/ja/battle/",
        "/zh/profile",
        "/en/onboarding",
        "/zh-tw/battle/",
        "/zh-tw/profile",
        "/zh-tw/onboarding",
      ]),
    );
  });
});
