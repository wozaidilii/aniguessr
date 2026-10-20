import { describe, expect, it } from "vitest";
import { crossStraitFlags, reviewCsv, reviewRow } from "./zh-tw-review.mjs";

describe("zh-TW review flags", () => {
  it("flags cross-strait terms on either side of the pair", () => {
    expect(crossStraitFlags("坐地铁到片濑")).toContain("地铁/捷運");
    expect(crossStraitFlags("搭捷運到片瀨")).toContain("地铁/捷運");
    expect(crossStraitFlags("来这里打卡")).toContain("打卡");
    expect(crossStraitFlags("看视频")).toContain("视频/影片");
    expect(crossStraitFlags("看影片")).toContain("视频/影片");
    expect(crossStraitFlags("更多信息")).toContain("信息/資訊");
    expect(crossStraitFlags("更多資訊")).toContain("信息/資訊");
    expect(crossStraitFlags("网络")).toContain("网络/網路");
    expect(crossStraitFlags("網路")).toContain("网络/網路");
    expect(crossStraitFlags("软件")).toContain("软件/軟體");
    expect(crossStraitFlags("軟體")).toContain("软件/軟體");
    expect(crossStraitFlags("鎌倉市的海岸")).toEqual([]);
  });

  it("writes every converted string, with flags in their own column", () => {
    const csv = reviewCsv([
      reviewRow({
        kind: "spot",
        id: "anitabi_1",
        field: "description",
        source: "opencc",
        zh: "地铁旁打卡",
        zhTw: "地鐵旁打卡",
      }),
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("kind,id,field,source,zh,zh_tw,flags,flagged");
    expect(csv).toContain("地铁/捷運 | 打卡");
    expect(csv).toContain(",yes");
  });
});
