import { describe, expect, it } from "vitest";
import {
  buildPostHogBeforeSendHook,
  sanitizePostHogProperties,
  sanitizePostHogUrl,
} from "~/lib/posthog-privacy";

const BATTLE_URL =
  "https://aniguessr.ayiora.com/ja/battle/ABC123?host=1&userId=player-1&name=Sakura%20Chan&avatarIcon=%F0%9F%A7%AD&mode=anime";

function beforeSend() {
  // The browser hook is source text inside the PostHog snippet. Execute that text.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(`return (${buildPostHogBeforeSendHook()});`);
  return factory() as (
    event: Record<string, unknown> | null,
  ) => Record<string, unknown> | null;
}

describe("posthog url privacy", () => {
  it("strips the display name and keeps the account id and game settings", () => {
    const cleaned = sanitizePostHogUrl(BATTLE_URL);

    expect(cleaned).not.toContain("name=");
    expect(cleaned).not.toContain("Sakura");
    expect(cleaned).toContain("userId=player-1");
    expect(cleaned).toContain("host=1");
    expect(cleaned).toContain("mode=anime");
    expect(cleaned).toContain("avatarIcon=");
  });

  it("strips name, email, and display-name aliases from search and paths", () => {
    expect(sanitizePostHogUrl("?name=Sakura&host=1")).toBe("?host=1");
    expect(sanitizePostHogUrl("?email=player%40example.com&mode=anime")).toBe(
      "?mode=anime",
    );
    expect(
      sanitizePostHogUrl("/ja/battle/ABC?display_name=Sakura&username=sakura"),
    ).toBe("/ja/battle/ABC");
  });

  it("strips a display name nested inside a login next path", () => {
    const cleaned = sanitizePostHogUrl(
      "https://aniguessr.ayiora.com/ja/login?error=google_state&next=%2Fja%2Fbattle%2FABC%3FuserId%3Dplayer-1%26name%3DSakura",
    );

    expect(cleaned).not.toContain("Sakura");
    expect(cleaned).not.toContain("name%3D");
    expect(cleaned).toContain("error=google_state");
    expect(cleaned).toContain("userId%3Dplayer-1");
  });

  it("leaves urls without those params unchanged", () => {
    const url = "https://aniguessr.ayiora.com/ja?difficulty=normal&rounds=5";
    expect(sanitizePostHogUrl(url)).toBe(url);
    expect(sanitizePostHogUrl("/ja/privacy")).toBe("/ja/privacy");
  });

  it("sanitizes url properties and leaves gameplay properties alone", () => {
    const properties = sanitizePostHogProperties({
      $current_url: BATTLE_URL,
      $pathname: "/ja/battle/ABC123",
      $referrer: "https://example.com/out?name=Sakura",
      $initial_current_url: BATTLE_URL,
      search: "?name=Sakura&host=1",
      path: "/ja/battle/ABC123",
      next_path: "/ja/battle/ABC123?name=Sakura&userId=player-1",
      rounds: 5,
      auth_state: "logged_in",
    });

    expect(properties.$current_url).not.toContain("Sakura");
    expect(properties.$referrer).toBe("https://example.com/out");
    expect(properties.$initial_current_url).not.toContain("name=");
    expect(properties.search).toBe("?host=1");
    expect(properties.next_path).toBe("/ja/battle/ABC123?userId=player-1");
    expect(properties.$pathname).toBe("/ja/battle/ABC123");
    expect(properties.rounds).toBe(5);
    expect(properties.auth_state).toBe("logged_in");
  });

  it("uses the same stripping rules in the before_send hook", () => {
    const hook = beforeSend();
    const event = hook({
      event: "$pageview",
      properties: {
        $current_url: BATTLE_URL,
        $pathname: "/ja/battle/ABC123?name=Sakura",
        $set_once: {
          $initial_current_url: BATTLE_URL,
          $initial_referrer: "https://news.example/a?email=a%40b.co",
        },
      },
      $set: {
        $referrer: "https://example.com/?displayName=Sakura&utm_source=x",
      },
    });

    const properties = event?.properties as {
      $current_url: string;
      $pathname: string;
      $set_once: { $initial_current_url: string; $initial_referrer: string };
    };
    const set = event?.$set as { $referrer: string };

    expect(properties.$current_url).not.toContain("Sakura");
    expect(properties.$current_url).toContain("userId=player-1");
    expect(properties.$pathname).toBe("/ja/battle/ABC123");
    expect(properties.$set_once.$initial_current_url).not.toContain("name=");
    expect(properties.$set_once.$initial_referrer).toBe(
      "https://news.example/a",
    );
    expect(set.$referrer).toBe("https://example.com/?utm_source=x");
    expect(hook(null)).toBeNull();
  });
});
