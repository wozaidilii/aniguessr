import { describe, expect, it } from "vitest";
import { homeProfileUiLocale } from "~/lib/home-profile-ui-locale";
import { buildProfileRegionOptions } from "~/lib/profile-region-options";
import { isEscapeKey, isPointerOutsideRoot } from "~/lib/menu-dismiss";

describe("homeProfileUiLocale", () => {
  it("uses zh-Hant-TW for zh-tw UI", () => {
    expect(homeProfileUiLocale("zh-tw")).toBe("zh-Hant-TW");
  });
});

describe("buildProfileRegionOptions", () => {
  it("puts unset first and Japan second without flag emoji", () => {
    const options = buildProfileRegionOptions("en", "No region");
    expect(options[0]?.value).toBe("");
    expect(options[0]?.label).toBe("No region");
    expect(options[1]?.value).toBe("JP");
    expect(options[1]?.label).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
    for (const option of options) {
      expect(option.label).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u);
    }
  });

  it("sorts remaining regions with Intl for zh-Hant-TW", () => {
    const options = buildProfileRegionOptions("zh-Hant-TW", "未設定");
    const labels = options.slice(2).map((item) => item.label);
    const sorted = [...labels].sort((a, b) =>
      new Intl.Collator("zh-Hant-TW").compare(a, b),
    );
    expect(labels).toEqual(sorted);
    expect(options.some((item) => item.value === "TW")).toBe(true);
  });
});

describe("menu dismiss helpers", () => {
  it("detects Escape", () => {
    expect(isEscapeKey("Escape")).toBe(true);
    expect(isEscapeKey("Enter")).toBe(false);
  });

  it("treats clicks outside the root as dismiss", () => {
    const root = {
      contains(node: Node) {
        return node === inside;
      },
    } as unknown as Element;
    const inside = { nodeType: 1 } as Node;
    const outside = { nodeType: 1 } as Node;
    expect(isPointerOutsideRoot(root, inside)).toBe(false);
    expect(isPointerOutsideRoot(root, outside)).toBe(true);
  });
});
