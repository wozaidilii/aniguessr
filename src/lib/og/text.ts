import { loadDefaultJapaneseParser } from "budoux";

import type { OgLocale } from "~/lib/og/copy";

/**
 * Line breaking from the OG template (spec §5).
 * Ported from the designer's og.js so Satori never wraps on its own.
 * `units / tokenize / layout / balance / fitText / ellipsize` match that file.
 */

export const COL_W = 640;
export const SAFETY = 0.96;
export const CHIP_CAP = 15;

const japanese = loadDefaultJapaneseParser();

export interface FitStep {
  size: number;
  lines: number;
}

export interface FitResult {
  size: number;
  lines: string[];
  truncated: boolean;
}

export const STEPS = {
  spotTitle: {
    cjk: [
      { size: 84, lines: 1 },
      { size: 68, lines: 2 },
      { size: 56, lines: 2 },
    ],
    en: [
      { size: 76, lines: 1 },
      { size: 64, lines: 2 },
      { size: 54, lines: 3 },
    ],
  },
  workTitle: {
    cjk: [
      { size: 84, lines: 1 },
      { size: 68, lines: 2 },
      { size: 56, lines: 2 },
      { size: 48, lines: 3 },
    ],
    en: [
      { size: 76, lines: 1 },
      { size: 64, lines: 2 },
      { size: 54, lines: 3 },
    ],
  },
  areaTitle: {
    cjk: [
      { size: 96, lines: 1 },
      { size: 76, lines: 2 },
      { size: 60, lines: 2 },
    ],
    en: [
      { size: 88, lines: 1 },
      { size: 72, lines: 2 },
      { size: 58, lines: 3 },
    ],
  },
  sub: {
    cjk: [
      { size: 30, lines: 1 },
      { size: 28, lines: 1 },
      { size: 28, lines: 2 },
    ],
    en: [
      { size: 30, lines: 1 },
      { size: 28, lines: 1 },
      { size: 28, lines: 2 },
    ],
  },
} as const satisfies Record<string, { cjk: FitStep[]; en: FitStep[] }>;

export type FitField = keyof typeof STEPS;

export function charUnits(ch: string): number {
  const c = ch.codePointAt(0) ?? 0;
  if (c === 0x200b) return 0;
  if (
    c >= 0x2e80 ||
    (c >= 0x3000 && c <= 0x30ff) ||
    (c >= 0xff00 && c <= 0xffef)
  ) {
    return 1;
  }
  if (ch === " " || ch === "\u00A0") return 0.22;
  if (/[A-Z]/u.test(ch)) return 0.74;
  if (/[0-9]/u.test(ch)) return 0.65;
  if (/[a-z]/iu.test(ch)) return 0.61;
  if (/[À-ɏ]/u.test(ch)) return 0.95;
  return 0.35;
}

export function units(value: string): number {
  let total = 0;
  for (const ch of value) total += charUnits(ch);
  return total;
}

/** ja phrases joined with ZWSP, same as the design build. */
export function segmentForOg(text: string, lang: OgLocale): string {
  if (lang !== "ja") return text;
  return japanese.parse(text).join("\u200B");
}

export function tokenize(text: string, lang: OgLocale): string[] {
  if (lang === "en") return text.split(/(?<=[ \-–/])/u);
  if (lang === "ja") {
    return text.split("\u200B").flatMap((part) => part.split(/(?<=[ 　])/u));
  }
  const out: string[] = [];
  for (const ch of text) {
    const previous = out[out.length - 1];
    if (previous && /[，。、！？：；」』）》·・…]/u.test(ch)) {
      out[out.length - 1] = previous + ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

export function layout(tokens: string[], cap: number): string[] {
  const lines: [string, number][] = [["", 0]];
  const push1 = (ch: string) => {
    const current = lines[lines.length - 1];
    if (!current) return;
    const width = charUnits(ch);
    if (current[0] === "" && /\s/u.test(ch)) return;
    if (current[1] + width > cap && current[0] !== "") {
      if (!/\s/u.test(ch)) lines.push([ch, width]);
      else lines.push(["", 0]);
    } else {
      current[0] += ch;
      current[1] += width;
    }
  };
  const push = (token: string) => {
    const current = lines[lines.length - 1];
    if (!current) return;
    let next = token;
    if (current[0] === "") next = next.replace(/^\s+/u, "");
    if (!next) return;
    const width = units(next.replace(/\s+$/u, ""));
    if (current[1] + width <= cap) {
      current[0] += next;
      current[1] += units(next);
      return;
    }
    if (current[0] === "") {
      for (const ch of next) push1(ch);
      return;
    }
    lines.push(["", 0]);
    push(next);
  };
  for (const token of tokens) push(token);
  return lines.map((line) => line[0].replace(/\s+$/u, ""));
}

export function balance(tokens: string[], cap: number, lineCount: number): string[] {
  let best = layout(tokens, cap);
  const widest = Math.max(...tokens.map((token) => units(token.trim())));
  const floor = Math.max(cap * 0.5, widest <= cap ? widest : 0);
  for (let measure = cap - 0.25; measure >= floor; measure -= 0.25) {
    const lines = layout(tokens, measure);
    if (lines.length > lineCount) break;
    best = lines;
  }
  return best;
}

export function ellipsize(last: string, cap: number, lang: OgLocale | "cjk"): string {
  let value = last;
  if (lang === "en") {
    while (units(`${value}…`) > cap && value.includes(" ")) {
      value = value.replace(/\s*\S+$/u, "");
    }
  }
  while (units(`${value}…`) > cap) {
    value = [...value].slice(0, -1).join("");
  }
  return `${value.replace(/[\s,・、·\-–&:：]+$/u, "")}…`;
}

/**
 * `keep` is an unbreakable suffix (multi-work label). It is never truncated.
 * Only the main text is cut, and the suffix stays at the end of the last line.
 */
export function fitText(
  text: string,
  lang: OgLocale,
  steps: readonly FitStep[],
  keep?: string,
): FitResult {
  const kept = keep ? ` ${keep.replace(/ /gu, "\u00A0")}` : "";
  const tokens = tokenize(text, lang).concat(kept ? [kept] : []);
  for (const step of steps) {
    const cap = (COL_W * SAFETY) / step.size;
    const lines = layout(tokens, cap);
    if (lines.length <= step.lines) {
      return {
        size: step.size,
        lines: lines.length > 1 ? balance(tokens, cap, lines.length) : lines,
        truncated: false,
      };
    }
  }
  const step = steps[steps.length - 1];
  if (!step) return { size: 28, lines: [text], truncated: false };
  const cap = (COL_W * SAFETY) / step.size;
  const full = text.replace(/\u200B/gu, "");
  const planned = layout(tokens, cap).slice(0, step.lines - 1);
  let pos = 0;
  for (const line of planned) pos = full.indexOf(line, pos) + line.length;
  const keptWidth = kept ? units(kept) : 0;
  planned.push(ellipsize(full.slice(pos).trim(), cap - keptWidth, lang) + kept);
  return { size: step.size, lines: planned, truncated: true };
}

export function stepsFor(field: FitField, lang: OgLocale): readonly FitStep[] {
  return STEPS[field][lang === "en" ? "en" : "cjk"];
}

export function fitField(
  text: string,
  lang: OgLocale,
  field: FitField,
  keep?: string,
): FitResult {
  const segmented = field === "sub" || field === "spotTitle" || field === "workTitle" || field === "areaTitle"
    ? segmentForOg(text, lang)
    : text;
  return fitText(segmented, lang, stepsFor(field, lang), keep);
}

export function fitChip(text: string): string {
  const plain = text.replace(/\u200B/gu, "");
  if (units(plain) <= CHIP_CAP) return plain;
  const latin =
    /[a-z]/iu.test(plain) && !/[\u3000-\u9fff]/u.test(plain) ? "en" : "cjk";
  return ellipsize(plain, CHIP_CAP, latin);
}

export function splitKeptSuffix(
  line: string,
  keep: string | undefined,
): { body: string; suffix: string } {
  if (!keep) return { body: line, suffix: "" };
  const suffix = keep.replace(/ /gu, "\u00A0");
  const withSpace = ` ${suffix}`;
  if (line.endsWith(withSpace)) {
    return { body: line.slice(0, -withSpace.length), suffix };
  }
  if (line === suffix) return { body: "", suffix };
  const index = line.lastIndexOf(suffix);
  if (index >= 0) {
    return { body: line.slice(0, index).replace(/\s+$/u, ""), suffix: line.slice(index) };
  }
  return { body: line, suffix: "" };
}

export function titleLineHeight(lang: OgLocale): number {
  return lang === "en" ? 1.12 : 1.18;
}
