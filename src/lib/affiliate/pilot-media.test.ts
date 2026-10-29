import { describe, expect, it } from "vitest";
import { shouldSuppressAffiliatePilotScreenshots } from "~/lib/affiliate/pilot-media";

describe("affiliate pilot media", () => {
  it("suppresses screenshots only on allowlisted routes", () => {
    expect(
      shouldSuppressAffiliatePilotScreenshots({
        spotId: "anitabi_100444_51i51yooo",
      }),
    ).toBe(true);
    expect(
      shouldSuppressAffiliatePilotScreenshots({
        locationSlug: "kamakura-kanagawa",
      }),
    ).toBe(true);
    expect(
      shouldSuppressAffiliatePilotScreenshots({
        spotId: "anitabi_51_5c4dgq9pm",
      }),
    ).toBe(false);
    expect(
      shouldSuppressAffiliatePilotScreenshots({
        locationSlug: "nishitama-tokyo",
      }),
    ).toBe(false);
  });
});
