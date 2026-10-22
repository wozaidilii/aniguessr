import { describe, expect, it } from "vitest";
import { fnv1a64Hex as packHash } from "./known-spot-id.mjs";
import { fnv1a64Hex, isKnownSpotId } from "../../src/lib/known-spot-id.ts";

describe("known spot ids", () => {
  it("uses the same hash in the build pack and the middleware lookup", () => {
    const id = "anitabi_37137_4slhba842";
    expect(fnv1a64Hex(id)).toBe(packHash(id));
    expect(isKnownSpotId(id)).toBe(true);
    expect(isKnownSpotId("not-a-real-spot-404")).toBe(false);
  });
});