/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import {
  ensureNotFoundShellPlaceholders,
  stampNotFoundShell,
} from "./scripts/not-found-shell-files.mjs";

// The trace glob records asset paths before prerender writes the real 404 HTML.
// Placeholders make the glob match; the build exit hook overwrites them.
ensureNotFoundShellPlaceholders();
if (process.argv.includes("build")) {
  process.on("exit", () => {
    try {
      const count = stampNotFoundShell();
      if (count > 0) console.log(`Stamped ${count} styled 404 shells`);
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["leaflet", "react-leaflet", "maplibre-gl"],
  outputFileTracingIncludes: {
    "/[locale]/pilgrimage/spots/[id]/opengraph-image": ["./assets/og-fonts/**/*"],
    "/[locale]/pilgrimage/anime/[slug]/opengraph-image": ["./assets/og-fonts/**/*"],
    "/[locale]/pilgrimage/locations/[slug]/opengraph-image": ["./assets/og-fonts/**/*"],
    "/[locale]/opengraph-image": ["./assets/og-fonts/**/*", "./public/og/**/*"],
    "/not-found-shell/[locale]": [
      "./assets/not-found-shell/*.html",
      "./.next/server/app/ja/http-404.html",
      "./.next/server/app/en/http-404.html",
      "./.next/server/app/zh/http-404.html",
      "./.next/server/app/zh-tw/http-404.html",
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default config;
