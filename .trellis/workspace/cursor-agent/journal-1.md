# Journal - cursor-agent (Part 1)

> AI development session journal
> Started: 2026-10-20

---

## 2026-10-20 — Cache pilgrimage pages

Pilgrimage HTML was dynamic because the shared root layout called `headers()` and middleware rewrote `/{locale}/pilgrimage/...` while setting a locale cookie. Vercel does not CDN-cache responses that include `Set-Cookie`.

The fix gives pilgrimage its own root layout and reads locale from the URL. Detail routes use on-demand ISR (`revalidate` 86400, empty `generateStaticParams`). The locale segment must not set `dynamicParams: false`, or unknown spot ids 404 with `NoFallbackError`.
