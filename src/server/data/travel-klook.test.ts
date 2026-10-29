import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getTravelKlookLinks } from "./travel-klook";

afterEach(() => vi.unstubAllEnvs());
describe("planner Klook destinations", () => {
  it("provides usable public destinations when affiliates are disabled", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "false");
    vi.stubEnv("KLOOK_AFFILIATE_ID", "test-id");
    const links = getTravelKlookLinks("zh-tw");
    expect(links.kyoto).toEqual({
      href: "https://www.klook.com/zh-TW/destination/c30-kyoto/",
      sponsored: false,
    });
    expect(links.japan?.href).toContain("co1012-japan");
  });
  it("uses the existing tracked wrapper only when both config fields are present", () => {
    vi.stubEnv("AFFILIATE_ENABLED", "true");
    vi.stubEnv("KLOOK_AFFILIATE_ID", "test-id");
    const link = getTravelKlookLinks("en").tokyo!;
    const url = new URL(link.href);
    expect(link.sponsored).toBe(true);
    expect(url.hostname).toBe("affiliate.klook.com");
    expect(url.searchParams.get("aid")).toBe("test-id");
    expect(url.searchParams.get("k_site")).toBe(
      "https://www.klook.com/en-US/destination/c28-tokyo/",
    );
    vi.stubEnv("KLOOK_AFFILIATE_ID", "");
    expect(getTravelKlookLinks("en").tokyo?.sponsored).toBe(false);
  });
});
