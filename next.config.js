/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["leaflet", "react-leaflet", "maplibre-gl"],
  outputFileTracingIncludes: {
    "/[locale]/pilgrimage/spots/[id]/opengraph-image": ["./assets/og-fonts/**/*"],
    "/[locale]/pilgrimage/anime/[slug]/opengraph-image": ["./assets/og-fonts/**/*"],
    "/[locale]/pilgrimage/locations/[slug]/opengraph-image": ["./assets/og-fonts/**/*"],
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
