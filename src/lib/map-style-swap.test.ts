import { describe, expect, it, vi } from "vitest";
import { swapMapStyleUrl } from "~/lib/map-style-swap";

function createMockMap() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    listeners,
    once: (event: string, handler: () => void) => {
      listeners[event] ??= [];
      listeners[event].push(handler);
    },
    emit: (event: string) => {
      for (const handler of listeners[event] ?? []) handler();
    },
    setStyle: vi.fn(),
  };
}

describe("swapMapStyleUrl", () => {
  it("uses diff false and runs onReady on style.load", () => {
    const map = createMockMap();
    const onReady = vi.fn();
    swapMapStyleUrl(map as never, "https://example.com/style.json", onReady);
    expect(map.setStyle).toHaveBeenCalledWith(
      "https://example.com/style.json",
      { diff: false },
    );
    expect(onReady).not.toHaveBeenCalled();
    map.emit("style.load");
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("runs onReady on idle when style.load is skipped", () => {
    const map = createMockMap();
    const onReady = vi.fn();
    swapMapStyleUrl(map as never, "https://example.com/style.json", onReady);
    map.emit("idle");
    expect(onReady).toHaveBeenCalledTimes(1);
    map.emit("style.load");
    expect(onReady).toHaveBeenCalledTimes(1);
  });
});
