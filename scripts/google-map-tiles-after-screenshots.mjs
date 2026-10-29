/**
 * After-Google basemap screenshots + tile usage against local `next start`.
 *
 * Requires (never printed):
 *   NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY
 *   NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL
 *
 * Usage:
 *   node scripts/google-map-tiles-after-screenshots.mjs <outputDir> [--port 3460] [--skip-build] [--timing-log]
 *
 * Playwright adds Referer https://aniguessr.ayiora.com/ only for tile.googleapis.com.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REFERER = "https://aniguessr.ayiora.com/";
const LOCATION_PATH = "/ja/pilgrimage/locations/kamakura-kanagawa";
const SPOT_PATH = "/ja/pilgrimage/spots/anitabi_100444_51i51yooo";

const args = process.argv.slice(2);
const outArg = args.find((a) => !a.startsWith("--"));
const OUT = path.resolve(outArg ?? "./google-map-tiles-after");
const portFlag = args.indexOf("--port");
const PORT =
  portFlag >= 0 && args[portFlag + 1]
    ? Number(args[portFlag + 1])
    : 3460;
const SKIP_BUILD = args.includes("--skip-build");
const BASE = `http://127.0.0.1:${PORT}`;

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL;
const TILES_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAP_AK;
const TIMING_LOG = args.includes("--timing-log");

function sharedEnv() {
  return {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/aniguessr",
    NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL: IMAGE_BASE_URL,
    NEXT_PUBLIC_HOME_MAP_BASEMAP:
      process.env.NEXT_PUBLIC_HOME_MAP_BASEMAP ?? "google",
    NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY: TILES_KEY,
    NEXT_PUBLIC_GOOGLE_MAP_AK:
      process.env.NEXT_PUBLIC_GOOGLE_MAP_AK ?? TILES_KEY,
    PORT: String(PORT),
  };
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

function startNextServer() {
  const child = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: ROOT,
    env: sharedEnv(),
    stdio: "ignore",
    detached: true,
  });
  child.unref();
  return child;
}

function stopNextServer(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already dead */
    }
  }
}

function createTileMetrics() {
  return {
    createSessionCalls: 0,
    tiles2dRequests: 0,
    viewportRequests: 0,
    sessionIds: new Set(),
  };
}

function trackRequest(metrics, url, method) {
  if (!url.includes("tile.googleapis.com")) return;
  if (method === "POST" && url.includes("/createSession")) {
    metrics.createSessionCalls += 1;
    return;
  }
  if (url.includes("/tile/v1/viewport")) {
    metrics.viewportRequests += 1;
    return;
  }
  if (url.includes("/v1/2dtiles/")) {
    metrics.tiles2dRequests += 1;
    try {
      const session = new URL(url).searchParams.get("session");
      if (session) metrics.sessionIds.add(session.slice(0, 12) + "…");
    } catch {
      /* ignore */
    }
  }
}

function metricsSnapshot(metrics) {
  return {
    createSessionCalls: metrics.createSessionCalls,
    tiles2dRequests: metrics.tiles2dRequests,
    viewportRequests: metrics.viewportRequests,
    distinctSessionPrefixes: [...metrics.sessionIds],
  };
}

function bindMetrics(context, metrics) {
  context.on("request", (req) => {
    trackRequest(metrics, req.url(), req.method());
  });
}

async function attachGoogleTileRouting(context) {
  await context.route("https://tile.googleapis.com/**", async (route) => {
    const request = route.request();
    const headers = {
      ...request.headers(),
      Referer: REFERER,
    };
    await route.continue({ headers });
  });
}

async function waitForHomeMap(page) {
  await page
    .locator(".home-map-canvas canvas")
    .first()
    .waitFor({ state: "visible", timeout: 45_000 })
    .catch(() => undefined);
  await page.waitForTimeout(2500);
}

async function waitForGoogleAttribution(page) {
  await page
    .locator(".google-map-tiles-attribution-text")
    .first()
    .waitFor({ state: "attached", timeout: 20_000 })
    .catch(() => undefined);
  await page.waitForTimeout(800);
}

async function screenshotPage(page, fileName, fullPage = false) {
  await page.screenshot({
    path: path.join(OUT, fileName),
    fullPage,
  });
}

async function panAndZoomHome(page) {
  const canvas = page.locator(".home-map-canvas canvas").first();
  const box = await canvas.boundingBox();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (let i = 0; i < 5; i += 1) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 80 - i * 10, cy - 40, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(500);
  }
}

async function main() {
  if (!TILES_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY (value is never printed).",
    );
    process.exit(1);
  }
  if (!IMAGE_BASE_URL) {
    console.error("Missing NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL.");
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });

  if (!SKIP_BUILD) {
    await runBuild();
  }

  const server = startNextServer();

  try {
    await waitForServer(`${BASE}/ja`);

    const browser = await chromium.launch();
    const usage = {
      refererInjectedFor: "https://tile.googleapis.com/**",
      refererValue: REFERER,
      scenarios: {},
      sessionReuseAcrossNavigations: null,
    };

    const shots = [
      ["after-google-home-ja-1440.png", "/ja", 1440, 900],
      ["after-google-home-ja-390.png", "/ja", 390, 844],
      ["after-google-home-zh-tw-1440.png", "/zh-tw", 1440, 900],
      ["after-google-home-zh-tw-390.png", "/zh-tw", 390, 844],
      [
        "after-google-pilgrimage-loc-ja-1440.png",
        LOCATION_PATH,
        1440,
        900,
      ],
      [
        "after-google-pilgrimage-loc-ja-390.png",
        LOCATION_PATH,
        390,
        844,
      ],
      ["after-google-spot-ja-1440.png", SPOT_PATH, 1440, 900],
      ["after-google-spot-ja-390.png", SPOT_PATH, 390, 844],
    ];

    for (const [file, pathname, width, height] of shots) {
      const context = await browser.newContext({
        viewport: { width, height },
      });
      const metrics = createTileMetrics();
      bindMetrics(context, metrics);
      await attachGoogleTileRouting(context);
      const page = await context.newPage();
      await page.goto(`${BASE}${pathname}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      if (pathname === "/ja" || pathname === "/zh-tw") {
        await waitForHomeMap(page);
      } else {
        await page.waitForTimeout(2500);
      }
      await waitForGoogleAttribution(page);
      await screenshotPage(
        page,
        file,
        pathname.includes("/spots/"),
      );
      const key =
        pathname === "/ja"
          ? width === 1440
            ? "coldHomeLoad1440"
            : "coldHomeLoad390"
          : pathname === "/zh-tw"
            ? width === 1440
              ? "coldHomeZhTw1440"
              : "coldHomeZhTw390"
            : pathname.includes("/locations/")
              ? width === 1440
                ? "pilgrimageLocation1440"
                : "pilgrimageLocation390"
              : width === 1440
                ? "spotPage1440"
                : "spotPage390";
      usage.scenarios[key] = metricsSnapshot(metrics);
      await context.close();
    }

    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const metrics = createTileMetrics();
      bindMetrics(context, metrics);
      await attachGoogleTileRouting(context);
      const page = await context.newPage();
      await page.goto(`${BASE}/ja`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      await waitForHomeMap(page);
      await panAndZoomHome(page);
      await waitForGoogleAttribution(page);
      usage.scenarios.homeInteraction1440Pan5Zoom3 =
        metricsSnapshot(metrics);
      await context.close();
    }

    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const homeMetrics = createTileMetrics();
      const navMetrics = createTileMetrics();
      let phase = "home";
      context.on("request", (req) => {
        const target = phase === "home" ? homeMetrics : navMetrics;
        trackRequest(target, req.url(), req.method());
      });
      await attachGoogleTileRouting(context);
      const page = await context.newPage();
      await page.goto(`${BASE}/ja`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      await waitForHomeMap(page);

      phase = "nav";
      await page.goto(`${BASE}${LOCATION_PATH}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      await page.waitForTimeout(2500);
      await page.goto(`${BASE}${SPOT_PATH}`, {
        waitUntil: "networkidle",
        timeout: 120_000,
      });
      await page.waitForTimeout(2000);

      usage.sessionReuseAcrossNavigations = {
        homeLoad: metricsSnapshot(homeMetrics),
        pilgrimageNavigationOnly: metricsSnapshot(navMetrics),
        sessionLikelyReused:
          navMetrics.createSessionCalls === 0 &&
          homeMetrics.createSessionCalls <= 1,
      };
      await context.close();
    }

    await browser.close();

    if (TIMING_LOG) {
      const timingContext = await chromium.launch();
      const timingPageContext = await timingContext.newContext({
        viewport: { width: 1440, height: 900 },
      });
      await attachGoogleTileRouting(timingPageContext);
      const timingPage = await timingPageContext.newPage();
      const marks = { navigationStartMs: Date.now() };
      await timingPage.goto(`${BASE}/ja`, { waitUntil: "commit", timeout: 120_000 });
      marks.domContentLoadedMs = Date.now();
      await timingPage.waitForSelector(".home-map-canvas canvas", {
        timeout: 60_000,
      });
      marks.firstCanvasMs = Date.now();
      await waitForGoogleAttribution(timingPage);
      marks.googleAttributionMs = Date.now();
      await timingPageContext.close();
      await timingContext.close();
      await writeFile(
        path.join(OUT, "load-timing.json"),
        JSON.stringify(
          {
            viewport: "1440x900",
            pathname: "/ja",
            marks,
            deltasMs: {
              toDomContentLoaded:
                marks.domContentLoadedMs - marks.navigationStartMs,
              toFirstCanvas: marks.firstCanvasMs - marks.navigationStartMs,
              toGoogleAttribution:
                marks.googleAttributionMs - marks.navigationStartMs,
            },
          },
          null,
          2,
        ),
      );
    }

    await writeFile(
      path.join(OUT, "tile-usage.json"),
      JSON.stringify(usage, null, 2),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          outputDir: OUT,
          screenshots: shots.map(([file]) => file),
          tileUsageFile: "tile-usage.json",
        },
        null,
        2,
      ),
    );
  } finally {
    stopNextServer(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
