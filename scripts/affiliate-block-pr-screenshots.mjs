/**
 * PR screenshots for affiliate block §9 (Designer spec).
 * Usage:
 *   AFFILIATE_ENABLED=1 KLOOK_AFFILIATE_ID=... RAKUTEN_AFFILIATE_ID=... \
 *     node scripts/affiliate-block-pr-screenshots.mjs
 *
 * Fallback (B-version) shots apply a Playwright DOM override on a Kamakura spot page.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = "/cursor/stores/bot/aniguessr-affiliate/pr-shots";
const SPOT = "anitabi_100444_51i51yooo";
const PORT = 3456;
const BASE = `http://127.0.0.1:${PORT}`;

const KLOOK_AID = process.env.KLOOK_AFFILIATE_ID ?? "141236";
const RAKUTEN_AID =
  process.env.RAKUTEN_AFFILIATE_ID ??
  "58ec3be6.d1d6c631.58ec3be7.5408d7db";

function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 404) return resolve();
      } catch {
        /* retry */
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Server did not become ready"));
        return;
      }
      setTimeout(tick, 500);
    };
    tick();
  });
}

function startServer(extraEnv = {}) {
  const env = {
    ...process.env,
    PORT: String(PORT),
    AFFILIATE_ENABLED: "true",
    KLOOK_AFFILIATE_ID: KLOOK_AID,
    RAKUTEN_AFFILIATE_ID: RAKUTEN_AID,
    ...extraEnv,
  };
  return spawn("npm", ["run", "start"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function measureLink(page) {
  return page.evaluate(() => {
    const link = document.querySelector("[data-affiliate-link-visual]");
    const img = link?.querySelector("img");
    const linkBox = link?.getBoundingClientRect();
    const imgBox = img?.getBoundingClientRect();
    const src = img?.getAttribute("src") ?? "";
    const entry = performance
      .getEntriesByType("resource")
      .find((e) => e.name.includes(src) && src);
    return {
      visual: link?.getAttribute("data-affiliate-link-visual"),
      rowHeightPx: linkBox ? Math.round(linkBox.height) : null,
      imgWidthPx: imgBox ? Math.round(imgBox.width) : null,
      imgHeightPx: imgBox ? Math.round(imgBox.height) : null,
      imgTransferBytes:
        entry && "transferSize" in entry
          ? Math.round(entry.transferSize)
          : null,
      imgSrc: src,
    };
  });
}

async function shot(page, name, url, viewport, { forceFallbackDom = false } = {}) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("[data-testid=affiliate-block]").waitFor({
    state: "visible",
    timeout: 120_000,
  });
  if (forceFallbackDom) {
    await page.evaluate(() => {
      const link = document.querySelector("[data-affiliate-link-visual]");
      if (!link) return;
      link.setAttribute("data-affiliate-link-visual", "fallback");
      const img = link.querySelector("img");
      img?.remove();
      const iconWrap = document.createElement("span");
      iconWrap.className =
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F1EC]";
      iconWrap.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-[18px] w-[18px] text-[#0C6B66]" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 12V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M3 12v4h18v-4"/><path d="M3 16v2M21 16v2M7 10V8M17 10V8"/></svg>';
      link.classList.remove("min-h-[72px]", "py-[7px]", "pl-[7px]", "pr-3.5");
      link.classList.add("min-h-14", "px-3.5", "py-2");
      link.insertBefore(iconWrap, link.querySelector(".min-w-0"));
    });
  }
  const block = page.locator("[data-testid=affiliate-block]");
  const measures = await measureLink(page);
  await block.screenshot({ path: path.join(OUT, `${name}-block.png`) });
  await page.screenshot({ path: path.join(OUT, `${name}-viewport.png`) });
  return measures;
}

async function runSet(label, { forceFallbackDom = false } = {}) {
  const child = startServer({});
  child.stdout?.on("data", () => {});
  child.stderr?.on("data", () => {});
  try {
    await waitForServer(`${BASE}/ja`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const results = {};
    for (const locale of ["ja", "zh-tw"]) {
      for (const width of [1440, 390]) {
        const tag = `${label}-${locale}-${width}`;
        const url = `${BASE}/${locale}/pilgrimage/spots/${SPOT}`;
        results[tag] = await shot(
          page,
          tag,
          url,
          { width, height: width === 390 ? 844 : 900 },
          { forceFallbackDom },
        );
        if (width === 1440 && locale === "ja" && !forceFallbackDom) {
          await page.locator("[data-affiliate-link-visual]").hover();
          await page.waitForTimeout(200);
          await page.locator("[data-testid=affiliate-block]").screenshot({
            path: path.join(OUT, `${tag}-hover-block.png`),
          });
        }
      }
    }
    if (forceFallbackDom) {
      results.note =
        "B-version DOM override on Kamakura spot (no allowlisted page outside pilot regions).";
    }
    await browser.close();
    return results;
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const thumb = await runSet("pilot-kamakura-thumbnail");
  const fallback = await runSet("fallback-test-override-dom", {
    forceFallbackDom: true,
  });
  const report = {
    spotId: SPOT,
    capturedAt: new Date().toISOString(),
    pilotRegionNote:
      "Allowlisted spots use location slugs kamakura-kanagawa and fujisawa-kanagawa only; no live B-version URL.",
    measurements: { ...thumb, ...fallback },
  };
  await writeFile(
    path.join(OUT, "measurements.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
