import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { OgLocale } from "~/lib/og/copy";

export function ogFontFamily(locale: OgLocale): string {
  if (locale === "zh") return "Sora, Noto Sans SC";
  if (locale === "zh-tw") return "Sora, Noto Sans TC";
  if (locale === "ja") return "Sora, Noto Sans JP";
  return "Sora";
}

export function ogCjkFamily(locale: OgLocale): string | null {
  if (locale === "zh") return "Noto Sans SC";
  if (locale === "zh-tw") return "Noto Sans TC";
  if (locale === "ja") return "Noto Sans JP";
  return null;
}

const FONT_DIR = path.join(process.cwd(), "assets/og-fonts");

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

const cache = new Map<string, Promise<ArrayBuffer>>();

function loadFont(file: string): Promise<ArrayBuffer> {
  const cached = cache.get(file);
  if (cached) return cached;
  const pending = readFile(path.join(FONT_DIR, file)).then((buffer) => {
    const copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(buffer);
    return copy;
  });
  cache.set(file, pending);
  return pending;
}

export async function fontsFor(locale: OgLocale): Promise<OgFont[]> {
  const [regular, semibold, bold] = await Promise.all([
    loadFont("sora-400.ttf"),
    loadFont("sora-600.ttf"),
    loadFont("sora-700.ttf"),
  ]);
  const fonts: OgFont[] = [
    { name: "Sora", data: regular, weight: 400, style: "normal" },
    { name: "Sora", data: regular, weight: 500, style: "normal" },
    { name: "Sora", data: semibold, weight: 600, style: "normal" },
    { name: "Sora", data: bold, weight: 700, style: "normal" },
  ];
  const cjk = ogCjkFamily(locale);
  if (!cjk) return fonts;
  const file =
    locale === "zh" ? "sc" : locale === "zh-tw" ? "tc" : "jp";
  const [medium, heavy] = await Promise.all([
    loadFont(`noto-${file}-500.ttf`),
    loadFont(`noto-${file}-700.ttf`),
  ]);
  fonts.push(
    { name: cjk, data: medium, weight: 500, style: "normal" },
    { name: cjk, data: heavy, weight: 700, style: "normal" },
  );
  return fonts;
}
