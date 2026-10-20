import { describe, expect, it } from "vitest";
import { toZhTw } from "./zh-tw.mjs";

describe("zh-TW conversion", () => {
  it("uses Taiwan phrasing and the Kamakura override", () => {
    expect(toZhTw("镰仓市")).toBe("鎌倉市");
    expect(toZhTw("藤泽市")).toBe("藤澤市");
    expect(toZhTw("江之岛")).toBe("江之島");
    expect(toZhTw("现实取景地")).toBe("實景取景地");
    expect(toZhTw("真实取景地")).toBe("實景取景地");
    expect(toZhTw("软件信息")).toBe("軟體資訊");
  });

  it("does not rewrite text that is already traditional", () => {
    expect(toZhTw("鎌倉市")).toBe("鎌倉市");
    expect(toZhTw("")).toBe("");
  });
});
