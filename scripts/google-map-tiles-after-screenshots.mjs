/**
 * After-Google basemap screenshots + tile usage against local `next start`.
 *
 * Requires (never printed):
 *   NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY
 *   NEXT_PUBLIC_ANIME_GUESSR_IMAGE_BASE_URL
 *
 * Usage:
 *   node scripts/google-map-tiles-after-screenshots.mjs <outputDir> [--port 3460] [--skip-build]
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
const TILES_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_TILES_KEY;

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

function createTileMetrics() {
  return {
    createSessionCalls: 0,
    tiles2dRequests: 0,
    sessionIds: new Set(),
  };
}

function trackRequest(metrics, url, method) {
  if (!url.includes("tile.googleapis.com")) return;
  if (method === "POST" && url.includes("/createSession")) {
    metrics.createSessionCalls += 1;
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
    distinctSessionPrefixes: [...metrics.sessionIds],
  };
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

  const server = spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: ROOT,
    env: sharedEnv(),
    stdio: "pipe",
  });

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
      context.on("request", (req) => {
        trackRequest(metrics, req.url(), req.method());
      });
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

    const interactContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const interactMetrics = createTileMetrics();
    interactContext.on("request", (req) => {
      trackRequest(interactMetrics, req.url(), req.method());
    });
    await attachGoogleTileRouting(interactContext);
    const interactPage = await interactContext.newPage();
    await interactPage.goto(`${BASE}/ja`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await waitForHomeMap(interactPage);
    await panAndZoomHome(interactPage);
    usage.scenarios.homeInteraction1440Pan5Zoom3 =
      metricsSnapshot(interactMetrics);

    const navMetrics = createTileMetrics();
    interactContext.on("request", (req) => {
      trackRequest(navMetrics, req.url(), req.method());
    });
    await interactPage.goto(`${BASE}${LOCATION_PATH}`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await interactPage.waitForTimeout(2500);
    await interactPage.goto(`${BASE}${SPOT_PATH}`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await interactPage.waitForTimeout(2000);

    const combinedCreateSession =
      interactMetrics.createSessionCalls + navMetrics.createSessionCalls;
    const combinedSessions = new Set([
      ...interactMetrics.sessionIds,
      ...navMetrics.sessionIds,
    ]);
    usage.sessionReuseAcrossNavigations = {
      createSessionCallsAfterHomeInteraction:
        interactMetrics.createSessionCalls,
      createSessionCallsOnPilgrimageNavigation: navMetrics.createSessionCalls,
      createSessionCallsTotalInSameContext: combinedCreateSession,
      distinctSessionPrefixesInContext: [...combinedSessions],
      sessionLikelyReused:
        navMetrics.createSessionCalls === 0 &&
        interactMetrics.createSessionCalls <= 1,
    };
    usage.scenarios.pilgrimageAndSpotSameContext =
      metricsSnapshot(navMetrics);

    await interactContext.close();
    await browser.close();

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
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
