# Pilgrimage navigation phase 1

## Goal

Help foreign anime fans (zh / en / ja) pick favorite series and navigate real filming spots in Japan. Public pilgrimage URLs stay fully server-rendered and CDN-cacheable. Favorites and “near me” only change the page after hydration.

## Requirements

- Favorite anime, no login. Persist subject IDs in `localStorage`. Account sync is deferred (it needs a new Neon column and would risk the CDN cache if done during render).
- MapLibre GL map on the hub, anime detail, and location detail pages. Style is OpenFreeMap dark (`https://tiles.openfreemap.org/styles/dark`), no API key. Cluster markers. Lazy-load the map module.
- When favorites exist, the hub and location maps default to those anime and can switch back to all spots. Favorite markers stay highlighted when all spots are shown. Anime detail maps always show that anime.
- Near me uses `navigator.geolocation` on the device only. Distance is computed locally. Favorites are listed first, then other spots, each group sorted by distance. Each spot has a Google Maps directions link (`/maps/dir/?api=1&destination=`).
- PWA: existing manifest and icons stay installable; add a service worker that must not cache HTML or pilgrimage documents.
- Attribution wherever spot data or images appear: the name `anitabi` links to the spot `sourceUrl` (or `https://anitabi.cn`), `CC BY-NC-SA 4.0` links to the license, plus a short note that anime screenshots are © their rights holders. No affiliate, ad, or monetization links. No company legal-entity text.

## Cache and SEO

- Do not call `cookies()` or `headers()` from pilgrimage render. Do not `Set-Cookie` on locale-prefixed pilgrimage responses.
- Server HTML is the no-favorites, no-location state for every visitor. Spot lists, metadata, hreflang, and sitemap stay as they are.
- Navigation coordinates live in build output `public/data/seo/spots-nav.json` (gitignored, produced with the SEO index). The browser fetches that file; location is never sent to the server.

## Done when

- `npm run check` and `npm test` pass, and `npm run build` completes.
- A Vercel preview serves the feature. The PR lists what shipped, the preview URL, mobile screenshots of the favorite picker, map, and near-me list, and the deferred account sync.
