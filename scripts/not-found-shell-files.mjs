/**
 * The styled 404 document is prerendered to `.next/server/app/<locale>/http-404.html`.
 * `next start` reads that file. Vercel only ships files listed in the route's NFT
 * trace, and that trace is recorded before the prerender finishes, so the build
 * also copies a frozen document into `assets/not-found-shell/` after tracing.
 * Placeholders exist before `next build` so the glob matches; the exit hook and
 * `node scripts/not-found-shell-files.mjs --require` replace them with the real HTML.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** @type {readonly ["ja", "zh", "en", "zh-tw"]} */
export const NOT_FOUND_SHELL_LOCALES = ["ja", "zh", "en", "zh-tw"];

const PLACEHOLDER = "<!DOCTYPE html><html><body>Not found</body></html>\n";

/**
 * @param {string} locale
 * @param {string} [cwd]
 */
export function notFoundShellAssetPath(locale, cwd = process.cwd()) {
  return path.join(cwd, "assets/not-found-shell", `${locale}.html`);
}

/** @param {string} [cwd] */
export function ensureNotFoundShellPlaceholders(cwd = process.cwd()) {
  mkdirSync(path.join(cwd, "assets/not-found-shell"), { recursive: true });
  for (const locale of NOT_FOUND_SHELL_LOCALES) {
    const file = notFoundShellAssetPath(locale, cwd);
    if (!existsSync(file)) writeFileSync(file, PLACEHOLDER);
  }
}

/**
 * Keep in sync with freezeNotFoundDocument in src/lib/not-found-route.ts.
 * @param {string} html
 */
export function freezeNotFoundDocument(html) {
  const stripped = html
    .replace(/<link\b[^>]*rel="preload"[^>]*as="script"[^>]*>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<meta\b[^>]*\bname=["'](?:robots|googlebot)["'][^>]*>/gi, "");
  const meta = '<meta name="robots" content="noindex"/>';
  if (stripped.includes("</head>")) {
    return stripped.replace("</head>", `${meta}</head>`);
  }
  return `${meta}${stripped}`;
}

/** @param {string} [cwd] */
export function stampNotFoundShell(cwd = process.cwd()) {
  let stamped = 0;
  for (const locale of NOT_FOUND_SHELL_LOCALES) {
    const source = path.join(cwd, ".next/server/app", locale, "http-404.html");
    if (!existsSync(source)) continue;
    const html = readFileSync(source, "utf8");
    if (!html.includes('rel="stylesheet"') || !html.includes("home-hdr")) {
      throw new Error(
        `Refusing to stamp ${locale} 404 shell: stylesheet or header missing`,
      );
    }
    const frozen = freezeNotFoundDocument(html);
    if (frozen.includes("<script")) {
      throw new Error(`Refusing to stamp ${locale} 404 shell: a script tag remained`);
    }
    const dest = notFoundShellAssetPath(locale, cwd);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, frozen);
    stamped += 1;
  }
  return stamped;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = stampNotFoundShell();
  if (process.argv.includes("--require") && count !== NOT_FOUND_SHELL_LOCALES.length) {
    console.error(
      `Expected ${NOT_FOUND_SHELL_LOCALES.length} styled 404 shells, stamped ${count}`,
    );
    process.exit(1);
  }
  console.log(`Stamped ${count} styled 404 shells`);
}
