import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(process.cwd(), "src/components/anitabi-attribution.tsx"),
  "utf8",
);

describe("anitabi attribution", () => {
  it("stays on by default and matches the shared sentence", () => {
    expect(source).toContain("export const SHOW_ANITABI_ATTRIBUTION = true");
    expect(source).toContain("if (!SHOW_ANITABI_ATTRIBUTION) return null");
    expect(source).toContain('href={ANITABI_SITE}');
    expect(source).toContain('href={CC_BY_NC_SA_4_URL}');
    expect(source).toContain("anitabi");
    expect(source).toContain("CC BY-NC-SA 4.0");

    expect(source).toContain('lead: "一部のスポット情報は "');
    expect(source).toContain('mid: " のデータを改変して使用しています（"');
    expect(source).toContain('tail: "）。"');
    expect(source).toContain('lead: "Some location data is adapted from "');
    expect(source).toContain('mid: " and used under "');
    expect(source).toContain('tail: "."');
    expect(source).toContain('lead: "部分地点数据来自 "');
    expect(source).toContain('mid: "，经修改后使用，采用 "');
    expect(source).toContain('tail: " 授权"');
    expect(source).toContain('lead: "部分地點資料來自 "');
    expect(source).toContain('mid: "，經修改後使用，採用 "');
    expect(source).toContain('tail: " 授權"');
  });
});
