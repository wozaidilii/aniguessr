import { describe, expect, it } from "vitest";
import {
  difficultyHint,
  difficultyLabel,
  difficultyStars,
} from "~/lib/difficulty-labels";

describe("difficulty display labels", () => {
  it("renames intermediate and miracle without touching the tier ids", () => {
    expect(difficultyLabel("ja", "intermediate")).toBe("中級");
    expect(difficultyLabel("ja", "miracle")).toBe("エキスパート");
    expect(difficultyLabel("zh", "intermediate")).toBe("中级");
    expect(difficultyLabel("zh", "miracle")).toBe("专家");
    expect(difficultyLabel("en", "miracle")).toBe("Expert");
    expect(difficultyLabel("ja", "beginner")).toBe("入門");
    expect(difficultyLabel("ja", "master")).toBe("マスター");
  });

  it("keeps hints in plain language", () => {
    expect(difficultyHint("ja", "beginner")).toContain("難易度1");
    expect(difficultyHint("en", "miracle")).not.toMatch(/miracle|veil|rite/i);
    expect(difficultyStars("miracle")).toBe("★4");
  });
});
