/**
 * Google Map Tiles preview: createSession probe, verification, and PNGs.
 * Does not print NEXT_PUBLIC_GOOGLE_MAP_AK.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = "/cursor/stores/bot/aniguessr-map/preview";
const PROD = "https://aniguessr.ayiora.com";
const PORT = 3460;
const LOCAL = `http://127.0.0.1:${PORT}`;
const LOCATION_PATH = "/ja/pilgrimage/locations/kamakura-kanagawa";
const SPOT_PATH = "/ja/pilgrimage/spots/anitabi_100444_51i51yooo";
const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL ??
  "https://pub-fb0cf55dbd0b4c4cb42bf8312f34dbd4.r2.dev";

function sharedEnv(extra = {}) {
  return {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/aniguessr",
    NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL: IMAGE_BASE_URL,
    NEXT_PUBLIC_HOME_MAP_BASEMAP:
      process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP ?? "google",
    ...extra,
  };
}

async function probeCreateSession() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
  if (!key) {
    return {
      ok: false,
      status: null,
      message: "NEXT_PUBLIC_GOOGLE_MAP_AK not set in this environment",
    };
  }
  try {
    const response = await fetch(
      `https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapType: "roadmap",
          language: "ja",
          region: "JP",
        }),
      },
    );
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        googleStatus: body?.error?.status,
        googleMessage: body?.error?.message,
        message: body?.error?.message ?? text.slice(0, 240),
      };
    }
    return {
      ok: true,
      status: response.status,
      sessionPresent: Boolean(body.session),
      expiry: body.expiry,
      tileWidth: body.tileWidth,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: ROOT,
      env: sharedEnv(),
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run build exited ${code}`));
    });
  });
}

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

async function captureSet(browser, label, baseUrl, paths, viewports) {
  for (const [name, pathname] of paths) {
    for (const { width, height, tag } of viewports) {
      const page = await browser.newPage({
        viewport: { width, height },
      });
      const tileUrls = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes("tile.googleapis.com/v1/2dtiles/")) {
          tileUrls.push(url);
        }
      });
      const response = await page.goto(`${baseUrl}${pathname}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      await page.waitForTimeout(2500);
      if (pathname === "/" || pathname === "/ja" || pathname === "/zh-tw") {
        await page
          .locator(".home-map-canvas canvas")
          .first()
          .waitFor({ state: "visible", timeout: 30_000 })
          .catch(() => undefined);
      }
      const file = `${label}-${name}-${tag}-${width}.png`;
      await page.screenshot({
        path: path.join(OUT, file),
        fullPage: pathname.includes("/spots/"),
      });
      const setCookie = response?.headers()["set-cookie"];
      const html = await page.content();
      const h1Count = await page.locator("h1").count();
      const areasLinks = await page.locator("#areas a[href]").count();
      const seriesLinks = await page.locator("#series a[href]").count();
      const keyInHtml =
        /AIza[0-9A-Za-z_-]{10,}/.test(html) ||
        /NEXT_PUBLIC_GOOGLE_MAP_AK/.test(html);
      await page.close();
      return {
        file,
        tileUrls: tileUrls.length,
        setCookie: setCookie ?? null,
        h1Count,
        areasLinks,
        seriesLinks,
        keyInHtml,
        status: response?.status(),
      };
    }
  }
  return null;
}

async function runTileInteractionCount(browser, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const tileUrls = new Set();
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("tile.googleapis.com/v1/2dtiles/")) {
      tileUrls.add(url.split("?")[0]);
    }
  });
  await page.goto(`${baseUrl}/ja`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(3000);
  const canvas = page.locator(".home-map-canvas canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
  const box = await canvas.boundingBox();
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 120, cy - 80, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
    await page.mouse.click(cx, cy, { clickCount: 2 });
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(1500);
  }
  const count = tileUrls.size;
  await page.close();
  return count;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const createSession = await probeCreateSession();
  await writeFile(
    path.join(OUT, "createSession-result.json"),
    JSON.stringify(createSession, null, 2),
  );

  const browser = await chromium.launch();
  const viewports = [
    { width: 1440, height: 900, tag: "1440" },
    { width: 390, height: 844, tag: "390" },
  ];
  const homePaths = [
    ["home-ja", "/ja"],
    ["home-zh-tw", "/zh-tw"],
  ];
  const pagePaths = [
    ["pilgrimage-loc-ja", LOCATION_PATH],
    ["spot-ja", SPOT_PATH],
  ];

  const verification = {};
  for (const [name, pathname] of [...homePaths, ...pagePaths]) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const res = await page.goto(`${PROD}${pathname}`, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUT, `before-prod-${name}-${vp.tag}-${vp.width}.png`),
        fullPage: pathname.includes("/spots/"),
      });
      await page.close();
      if (pathname.startsWith("/ja") && vp.tag === "1440" && name === "home-ja") {
        verification.prodHome = {
          setCookie: res?.headers()["set-cookie"] ?? null,
          h1: await (async () => {
            const p = await browser.newPage();
            await p.goto(`${PROD}/ja`, { waitUntil: "domcontentloaded" });
            const count = await p.locator("h1").count();
            const areas = await p.locator("#areas a[href]").count();
            const series = await p.locator("#series a[href]").count();
            await p.close();
            return { h1Count: count, areasLinks: areas, seriesLinks: series };
          })(),
        };
      }
    }
  }

  if (process.env.SKIP_MAP_PREVIEW_BUILD !== "1") {
    await runBuild();
  }
  const server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: ROOT,
    env: sharedEnv({ PORT: String(PORT) }),
    stdio: "pipe",
  });
  await waitForServer(`${LOCAL}/ja`);
  let tileInteractionCount = 0;
  try {
    for (const [name, pathname] of [...homePaths, ...pagePaths]) {
      for (const vp of viewports) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
        });
        await page.goto(`${LOCAL}${pathname}`, {
          waitUntil: "networkidle",
          timeout: 90_000,
        });
        await page.waitForTimeout(3000);
        await page.screenshot({
          path: path.join(OUT, `after-local-${name}-${vp.tag}-${vp.width}.png`),
          fullPage: pathname.includes("/spots/"),
        });
        if (name === "home-ja" && vp.tag === "1440") {
          const html = await page.content();
          verification.localHome = {
            setCookie: null,
            h1Count: await page.locator("h1").count(),
            areasLinks: await page.locator("#areas a[href]").count(),
            seriesLinks: await page.locator("#series a[href]").count(),
            keyInHtml:
              /AIza[0-9A-Za-z_-]{10,}/.test(html) ||
              /NEXT_PUBLIC_GOOGLE_MAP_AK/.test(html),
            googleBasemapLikely: html.includes("google-map-tiles-attribution"),
          };
        }
        await page.close();
      }
    }
    if (createSession.ok) {
      tileInteractionCount = await runTileInteractionCount(browser, LOCAL);
    }
  } finally {
    server.kill("SIGTERM");
  }

  await browser.close();
  await writeFile(
    path.join(OUT, "verification.json"),
    JSON.stringify({ createSession, verification, tileInteractionCount }, null, 2),
  );
  console.log(
    JSON.stringify({ createSession, verification, tileInteractionCount, out: OUT }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
