# Navigation approach

- Spot count is about 24,750 across 796 anime. The SEO index is too large to embed in HTML. `scripts/build-pilgrimage-seo-data.mjs` also writes `public/data/seo/spots-nav.json`: anime titles plus spot tuples `[id, subjectId, locationSlug, lat, lng, zh, ja, en]`. Anitabi source URLs are `https://anitabi.cn/map?bangumiId={subjectId}&pid={pid}` derived from `anitabi_{subjectId}_{pid}` (verified against every question).
- Map style: OpenFreeMap `styles/dark`. Vector tiles and glyphs, no key. MapLibre clustering is built in (`cluster: true`).
- Favorites key: `aniguessr_pilgrimage_favorites_v1`. Read only in `useEffect` so SSR and the first client render stay empty.
- Account sync is deferred. Player data is in Neon via `src/server/data/player-store.ts`. A favorites table would need a migration, and reading it while rendering pilgrimage HTML would drop the CDN cache from PR #5.
- Service worker at `public/sw.js` caches only icon files. `/sw.js` must stay locale-exempt so middleware does not 307 it.
