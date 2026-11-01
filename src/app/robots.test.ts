import { describe, expect, it } from "vitest";
import robots, {
  AI_TRAINING_CRAWLERS,
  SEARCH_AND_ANSWER_CRAWLERS,
} from "~/app/robots";

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

  it("uses * as the first rule group", () => {
    const result = robots();
    expect(Array.isArray(result.rules)).toBe(true);
    const rules = result.rules as NonNullable<
      Extract<ReturnType<typeof robots>["rules"], unknown[]>
    >;
    expect(rules[0]?.userAgent).toBe("*");
  });

  it("blocks AI training crawlers site-wide", () => {
    const result = robots();
    const rules = result.rules as NonNullable<
      Extract<ReturnType<typeof robots>["rules"], unknown[]>
    >;
    const trainingRule = rules.find(
      (rule) =>
        Array.isArray(rule.userAgent) &&
        rule.userAgent.includes(AI_TRAINING_CRAWLERS[0]),
    );
    expect(trainingRule).toBeDefined();
    const disallow = trainingRule?.disallow;
    const lines = Array.isArray(disallow) ? disallow : disallow ? [disallow] : [];
    expect(lines).toContain("/");
    for (const token of AI_TRAINING_CRAWLERS) {
      expect(trainingRule?.userAgent).toContain(token);
    }
  });

  it("does not give search crawlers their own rule groups", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allAgents = rules.flatMap((rule) =>
      Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent],
    );
    for (const token of SEARCH_AND_ANSWER_CRAWLERS) {
      expect(allAgents).not.toContain(token);
    }
  });

  it("does not allow non-* rule groups", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    for (const rule of rules) {
      if (rule.userAgent === "*") continue;
      expect(rule.allow).toBeUndefined();
    }
  });
});
