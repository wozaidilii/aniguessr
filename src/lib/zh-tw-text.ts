import { Converter } from "opencc-js/cn2t";

const toTraditional = Converter({ from: "cn", to: "twp" });

/** Simplified Chinese → Taiwan Traditional. Phrases follow OpenCC s2twp. */
export function toZhTw(value: string): string {
  return toTraditional(value);
}
