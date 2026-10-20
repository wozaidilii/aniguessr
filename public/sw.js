// @ts-nocheck
/**
 * Installable PWA shell. Only icon files are cached.
 * Document / HTML requests are ignored so pilgrimage CDN and SEO HTML stay fresh.
 */
const CACHE = "aniguessr-static-v1";
const STATIC_PATHS = new Set([
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_PATHS.has(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }),
  );
});
