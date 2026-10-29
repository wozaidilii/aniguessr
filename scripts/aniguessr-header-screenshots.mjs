#!/usr/bin/env node
/**
 * Capture header redesign acceptance screenshots (local production server).
 * Usage:
 *   node scripts/aniguessr-header-screenshots.mjs [baseUrl]
 *   node scripts/aniguessr-header-screenshots.mjs --only-open [baseUrl]
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const onlyOpen = args.includes("--only-open");
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

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const measurements = [];

for (const locale of locales) {
  for (const signedIn of onlyOpen ? [true] : [false, true]) {
    for (const viewport of onlyOpen
      ? [
          { width: 1440, height: 900, tag: "1440" },
          { width: 390, height: 844, tag: "390" },
        ]
      : [
          { width: 1440, height: 900, tag: "1440" },
          { width: 390, height: 844, tag: "390" },
        ]) {
      const context = await browser.newContext({ viewport });
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

      if (!onlyOpen) {
        const auth = signedIn ? "signed-in" : "signed-out";
        await shot(page, `${viewport.tag}-${locale}-${auth}.png`);
      }

      if (!onlyOpen && viewport.width >= 768) {
        const x = await langButtonX(page);
        measurements.push({ locale, signedIn, x });
      }

      if (signedIn && viewport.width >= 768) {
        await page.locator(".home-avatar-btn").click();
        await page.locator(".home-account-menu.home-header-overlay").waitFor({
          state: "visible",
        });
        await shot(page, `${viewport.tag}-${locale}-account-menu-open.png`);
        await page.keyboard.press("Escape");
        await page.locator(".home-hdr-lang .home-lang-current").click();
        await page.locator(".home-lang-popover-portal").waitFor({
          state: "visible",
        });
        await shot(page, `${viewport.tag}-${locale}-lang-menu-open.png`);
        await page.keyboard.press("Escape");
        await page.locator(".home-avatar-btn").click();
        await page
          .getByRole("menuitem")
          .filter({ hasText: /編輯|编辑|Edit|プロフィール/ })
          .first()
          .click();
        await page.locator(".home-profile-layer").waitFor({ state: "visible" });
        await shot(page, `${viewport.tag}-${locale}-profile-dialog-open.png`);
        await page.keyboard.press("Escape");
      }

      if (signedIn && viewport.width < 768) {
        await page.locator(".home-avatar-btn").click();
        await page.locator(".home-account-sheet-panel").waitFor({
          state: "visible",
        });
        await shot(page, `${viewport.tag}-${locale}-account-sheet-open.png`);
      }

      if (!onlyOpen && !signedIn && viewport.width < 768) {
        await page.locator(".home-burger").click();
        await shot(page, `${viewport.tag}-${locale}-drawer-open.png`);
      }

      await context.close();
    }
  }
}

if (!onlyOpen) {
  const shifts = [];
  for (const locale of locales) {
    const out = measurements.find((m) => m.locale === locale && !m.signedIn)?.x;
    const inn = measurements.find((m) => m.locale === locale && m.signedIn)?.x;
    if (out != null && inn != null) shifts.push(Math.abs(inn - out));
  }

  const maxShift = shifts.length ? Math.max(...shifts) : null;
  const cookieRes = await fetch(`${baseUrl}/ja`);
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

await browser.close();
console.log(`Screenshots saved to ${outDir}`);
