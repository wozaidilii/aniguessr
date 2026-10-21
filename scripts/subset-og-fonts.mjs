/**
 * Build the TTF/OTF files the OG route reads at request time.
 * Full CJK fonts stay in .cache; only the glyphs used by pilgrimage copy
 * and the SEO index are written to assets/og-fonts.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import subsetFont from "subset-font";

const root = process.cwd();
const cacheDir = path.join(root, ".cache/og-fonts");
const outDir = path.join(root, "assets/og-fonts");

const sources = [
  ["sora-400.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/sora@5.2.8/latin-400-normal.ttf"],
  ["sora-600.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/sora@5.2.8/latin-600-normal.ttf"],
  ["sora-700.ttf", "https://cdn.jsdelivr.net/fontsource/fonts/sora@5.2.8/latin-700-normal.ttf"],
  ["NotoSansJP-Medium.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/JP/NotoSansJP-Medium.otf"],
  ["NotoSansJP-Bold.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/JP/NotoSansJP-Bold.otf"],
  ["NotoSansSC-Medium.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/SC/NotoSansSC-Medium.otf"],
  ["NotoSansSC-Bold.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf"],
  ["NotoSansTC-Medium.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Medium.otf"],
  ["NotoSansTC-Bold.otf", "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf"],
];

const outputs = [
  ["sora-400.ttf", "sora-400.ttf", false],
  ["sora-600.ttf", "sora-600.ttf", false],
  ["sora-700.ttf", "sora-700.ttf", false],
  ["NotoSansJP-Medium.otf", "noto-jp-500.ttf", true],
  ["NotoSansJP-Bold.otf", "noto-jp-700.ttf", true],
  ["NotoSansSC-Medium.otf", "noto-sc-500.ttf", true],
  ["NotoSansSC-Bold.otf", "noto-sc-700.ttf", true],
  ["NotoSansTC-Medium.otf", "noto-tc-500.ttf", true],
  ["NotoSansTC-Bold.otf", "noto-tc-700.ttf", true],
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(name, url) {
  const target = path.join(cacheDir, name);
  if (await exists(target)) return target;
  const seeded = path.join("/tmp/og-src", name);
  if (await exists(seeded)) {
    await writeFile(target, await readFile(seeded));
    return target;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`font download failed ${response.status} ${url}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  return target;
}

function collectText(raw) {
  const chars = new Set();
  for (let code = 32; code < 127; code += 1) chars.add(String.fromCharCode(code));
  const extra = "\u00A0\u200B\u00B7\u2013\u2014\u2026\u30FB\u3001\u3002・，。！？：；「」『』（）";
  for (const ch of extra) chars.add(ch);
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 127) chars.add(ch);
  }
  return [...chars].join("");
}

const indexPath = path.join(root, "public/data/seo/index.json");
const copyPath = path.join(root, "src/lib/og/copy.ts");
const pieces = [await readFile(copyPath, "utf8")];
if (await exists(indexPath)) pieces.push(await readFile(indexPath, "utf8"));
const text = collectText(pieces.join("\n"));

await mkdir(cacheDir, { recursive: true });
await mkdir(outDir, { recursive: true });

for (const [sourceName, outputName, subset] of outputs) {
  const url = sources.find((item) => item[0] === sourceName)?.[1];
  if (!url) throw new Error(`missing source url for ${sourceName}`);
  const sourcePath = await download(sourceName, url);
  const destination = path.join(outDir, outputName);
  if (!subset) {
    await writeFile(destination, await readFile(sourcePath));
    console.log(`${outputName} copied`);
    continue;
  }
  const buffer = await readFile(sourcePath);
  const subsetBuffer = await subsetFont(buffer, text, { targetFormat: "sfnt" });
  await writeFile(destination, subsetBuffer);
  console.log(
    `${outputName} ${Math.round(subsetBuffer.length / 1024)}KB from ${Math.round(buffer.length / 1024)}KB`,
  );
}
