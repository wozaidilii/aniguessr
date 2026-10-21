import { describe, expect, it } from "vitest";
import {
  STREET_VIEW_STATUS_LOCALES,
  STREET_VIEW_UNAVAILABLE,
} from "~/lib/street-view-status-copy";

describe("street view status copy", () => {
  it("never names an environment variable", () => {
    for (const locale of STREET_VIEW_STATUS_LOCALES) {
      const text = STREET_VIEW_UNAVAILABLE[locale];
      expect(text).not.toMatch(/NEXT_PUBLIC_|GOOGLE_MAP_AK|\.env/u);
      expect(text.length).toBeGreaterThan(10);
    }
    expect(STREET_VIEW_UNAVAILABLE.ja).toBe(
      "ストリートビューを読み込めませんでした。しばらくしてから再読み込みしてください。",
    );
  });
});
