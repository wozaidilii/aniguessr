import { describe, expect, it } from "vitest";
import { segmentForOg } from "~/lib/og/text";
import {
  edgeMargin,
  ellipsize,
  fitText,
  layout,
  splitEdgeSpace,
  splitKeptSuffix,
  tokenize,
  units,
  visibleText,
} from "~/lib/og/text";
import { STEPS } from "~/lib/og/text";

const cjkTitle = STEPS.spotTitle.cjk;
const enTitle = STEPS.spotTitle.en;
const sub = STEPS.sub.cjk;

describe("og text fit", () => {
  it("balances a Chinese place name instead of leaving one character", () => {
    const text = "镰仓高校前站旁的道口";
    const fit = fitText(text, "zh", cjkTitle);
    expect(fit.lines).toEqual(["镰仓高校前", "站旁的道口"]);
    expect(fit.truncated).toBe(false);
  });

  it("keeps closing punctuation off the start of a Chinese line", () => {
    const tokens = tokenize("你好，世界。真的！", "zh");
    expect(tokens.some((token) => /^[，。！]/u.test(token))).toBe(false);
    const lines = layout(tokens, 3);
    expect(lines.some((line) => /^[，。！]/u.test(line))).toBe(false);
  });

  it("breaks English only after spaces, hyphens, and slashes", () => {
    const fit = fitText(
      "Railroad crossing at Kamakura-Kōkōmae Station",
      "en",
      enTitle,
    );
    expect(fit.truncated).toBe(false);
    expect(fit.lines.join(" ")).toContain("Railroad");
    expect(fit.lines.some((line) => line.includes("crossi\n"))).toBe(false);
    for (const line of fit.lines) {
      expect(line.endsWith("-") || !line.includes("Kamakura-Kō")).toBe(true);
    }
  });

  it("does not split a Japanese phrase that BudouX keeps together", () => {
    const segmented = segmentForOg("鎌倉高校前駅の踏切", "ja");
    expect(segmented.includes("踏\u200B切")).toBe(false);
    const fit = fitText(segmented, "ja", cjkTitle);
    expect(fit.lines.join("")).toBe("鎌倉高校前駅の踏切");
    expect(fit.lines.some((line) => line === "切" || line === "踏")).toBe(false);
  });

  it("truncates only the work title and keeps the multi-work suffix intact", () => {
    const keep = "ほか 12 作品";
    const fit = fitText(
      segmentForOg(
        "ラブライブ！虹ヶ咲学園スクールアイドル同好会 完結編 第1章 劇場版スペシャルエディション",
        "ja",
      ),
      "ja",
      sub,
      keep,
    );
    const suffix = keep.replace(/ /gu, "\u00A0");
    const holders = fit.lines.filter((line) => line.includes(suffix));
    expect(holders).toHaveLength(1);
    const split = splitKeptSuffix(holders[0] ?? "", keep);
    expect(split.suffix).toBe(suffix);
    expect(split.body.endsWith("…") || fit.truncated).toBe(true);
    expect(fit.lines.join("")).not.toContain("ほ\n");
    expect(units(split.suffix)).toBe(units(suffix));
    for (const line of fit.lines) {
      const parts = splitKeptSuffix(line, keep);
      expect(parts.suffix === "" || parts.suffix === suffix).toBe(true);
    }
  });

  it("omits the suffix token when the count is zero", () => {
    const fit = fitText("青春ブタ野郎はバニーガール先輩の夢を見ない", "ja", sub);
    expect(fit.lines.join("")).not.toContain("ほか");
  });

  it("turns edge spaces into margins and keeps the words", () => {
    expect(splitEdgeSpace(" real-life locations")).toEqual({
      lead: true,
      trail: false,
      text: "real-life locations",
    });
    expect(splitEdgeSpace(" series · ")).toEqual({
      lead: true,
      trail: true,
      text: "series ·",
    });
    expect(splitEdgeSpace(" か所")).toEqual({
      lead: true,
      trail: false,
      text: "か所",
    });
    expect(splitEdgeSpace("\u00A0ほか 12 作品")).toEqual({
      lead: true,
      trail: false,
      text: "ほか 12 作品",
    });
    expect(edgeMargin(28)).toBe(8);
    expect(visibleText("ほか\u00A012\u00A0作品")).toBe("ほか 12 作品");
  });

  it("strips dangling punctuation before the ellipsis", () => {
    expect(ellipsize("江ノ島・", 4, "ja")).toBe("江ノ島…");
  });
});
