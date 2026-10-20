# Cache pilgrimage pages at the CDN

## Goal

Locale-prefixed pilgrimage pages (`/{ja|zh|en}/pilgrimage/...`, including spot, anime, and location pages) must be cacheable on Vercel's CDN so crawler traffic does not trigger a serverless render per URL. Search engines stay allowed. Do not add `noindex` or block crawlers.

## Requirements

- Stop reading `headers()` / `cookies()` while rendering pilgrimage HTML. Locale comes from the `[locale]` path segment.
- ISR with `revalidate` of 86400 seconds. `generateStaticParams` for spot, anime, and location detail routes returns an empty array so pages are generated on first request and then cached.
- Middleware must not rewrite those URLs and must not `Set-Cookie` on them (Vercel does not CDN-cache responses that set cookies). Persist the locale cookie in the browser instead.
- Spot photos stay plain `<img>` elements aimed at the public image CDN, not `next/image`. The anime image proxy, if used, sends a public `s-maxage` / `stale-while-revalidate` cache header.
- Pilgrimage pages read the build-time SEO JSON index, not Postgres. No extra per-request database query.
- `robots.txt` and the sitemap stay crawlable.

## Done when

- `next build` lists pilgrimage spot routes as ISR / static, not per-request dynamic.
- A second request for a spot URL is a cache hit (`x-nextjs-cache` locally, `x-vercel-cache: HIT` or `PRERENDER` / `STALE` on the preview) and `Cache-Control` includes `s-maxage`.
- `/ja`, `/zh`, and `/en` spot HTML each render that language.
