#!/usr/bin/env node
/**
 * Capture header redesign acceptance screenshots (local production server).
 * Usage:
 *   node scripts/aniguessr-header-screenshots.mjs [baseUrl]
 *   node scripts/aniguessr-header-screenshots.mjs --only-open [baseUrl]
 *   node scripts/aniguessr-header-screenshots.mjs --designer-pass [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const onlyOpen = args.includes("--only-open");
const designerPass = args.includes("--designer-pass");
const baseUrl = args.find((arg) => arg.startsWith("http")) ?? "http://127.0.0.1:3000";
const outDir =
  process.env.HEADER_SHOTS_DIR ??
  "/cursor/stores/bot/aniguessr-header-shots";
const locales = ["ja", "en", "zh", "zh-tw"];

const demoSession = {
  token: "demo-local-session",
  user: {
    id: "demo-player",
    email: "sakura.demo@example.com",
    name: "さくら",
    avatar: { icon: "🌸", color: "#ec4899" },
    profileCompleted: true,
    soloHighScore: 0,
    countryCode: "JP",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};

async function settle(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(320);
}

async function shot(page, name) {
  await settle(page);
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
}

async function langButtonX(page) {
  const btn = page.locator(".home-hdr-lang .home-lang-current");
  if ((await btn.count()) === 0) return null;
  const box = await btn.first().boundingBox();
  return box?.x ?? null;
}

async function writeMeasurements(measurements, base) {
  const shifts = [];
  for (const locale of locales) {
    const out = measurements.find((m) => m.locale === locale && !m.signedIn)?.x;
    const inn = measurements.find((m) => m.locale === locale && m.signedIn)?.x;
    if (out != null && inn != null) shifts.push(Math.abs(inn - out));
  }
  const maxShift = shifts.length ? Math.max(...shifts) : null;
  const cookieRes = await fetch(`${base}/ja`);
  const setCookie = cookieRes.headers.get("set-cookie");
  await writeFile(
    path.join(outDir, "measurements.json"),
    JSON.stringify(
      {
        languageControlXShiftPx: maxShift,
        perLocale: locales.map((locale) => ({
          locale,
          signedOutX: measurements.find((m) => m.locale === locale && !m.signedIn)
            ?.x,
          signedInX: measurements.find((m) => m.locale === locale && m.signedIn)?.x,
          delta:
            measurements.find((m) => m.locale === locale && m.signedIn)?.x !=
              null &&
            measurements.find((m) => m.locale === locale && !m.signedIn)?.x != null
              ? Math.abs(
                  (measurements.find((m) => m.locale === locale && m.signedIn)?.x ??
                    0) -
                    (measurements.find((m) => m.locale === locale && !m.signedIn)
                      ?.x ?? 0),
                )
              : null,
        })),
        publicJaSetCookie: setCookie,
      },
      null,
      2,
    ),
  );
  console.log(`Max language control x-shift: ${maxShift}px`);
  console.log(`GET /ja Set-Cookie: ${setCookie ?? "(none)"}`);
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const measurements = [];

for (const locale of locales) {
  if (designerPass || !onlyOpen) {
    for (const signedIn of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
      if (signedIn) {
        await page.evaluate((session) => {
          localStorage.setItem(
            "histoguessr_player_session",
            JSON.stringify(session),
          );
        }, demoSession);
        await page.reload({ waitUntil: "networkidle" });
      }
      if (!designerPass) {
        await shot(page, `1440-${locale}-${signedIn ? "signed-in" : "signed-out"}.png`);
      }
      const x = await langButtonX(page);
      measurements.push({ locale, signedIn, x });
      await context.close();
    }
  }

  if (designerPass || onlyOpen) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
    await page.evaluate((session) => {
      localStorage.setItem(
        "histoguessr_player_session",
        JSON.stringify(session),
      );
    }, demoSession);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".home-hdr-lang .home-lang-current").click();
    await page.locator(".home-lang-popover-portal").waitFor({ state: "visible" });
    await shot(page, `1440-${locale}-lang-menu-open.png`);
    await context.close();
  }

  if (designerPass || !onlyOpen) {
    for (const signedIn of designerPass ? [false] : [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
      if (signedIn) {
        await page.evaluate((session) => {
          localStorage.setItem(
            "histoguessr_player_session",
            JSON.stringify(session),
          );
        }, demoSession);
        await page.reload({ waitUntil: "networkidle" });
      }
      if (!designerPass) {
        await shot(page, `390-${locale}-${signedIn ? "signed-in" : "signed-out"}.png`);
      } else if (!signedIn) {
        await shot(page, `390-${locale}-signed-out.png`);
      }
      if (!signedIn && (designerPass || !onlyOpen)) {
        await page.locator(".home-burger").click();
        await page.locator(".home-sheet-nav").waitFor({ state: "visible" });
        await shot(page, `390-${locale}-drawer-open.png`);
      }
      await context.close();
    }
  }

  if (designerPass || onlyOpen) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
    await page.evaluate((session) => {
      localStorage.setItem(
        "histoguessr_player_session",
        JSON.stringify(session),
      );
    }, demoSession);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".home-avatar-btn").click();
    await page.locator(".home-account-sheet-panel").waitFor({ state: "visible" });
    await shot(page, `390-${locale}-account-sheet-open.png`);
    await context.close();
  }
}

if (!onlyOpen || designerPass) {
  await writeMeasurements(measurements, baseUrl);
}

await browser.close();
console.log(`Screenshots saved to ${outDir}`);
