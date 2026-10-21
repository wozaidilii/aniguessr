import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { withAnimeLocale } from "~/lib/anime-locale";
import { shouldBypassLocale } from "~/lib/locale-exempt";
import {
  PILGRIMAGE_REVALIDATE_SECONDS,
  isLocalePrefixedPilgrimagePath,
} from "~/lib/pilgrimage-cache";
import { PILGRIMAGE_REDIRECT_MAP } from "~/lib/pilgrimage-redirects";
import { middleware } from "~/middleware";

const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function request(
  pathname: string,
  host = "aniguessr.ayiora.com",
  userAgent = "Mozilla/5.0",
) {
  const url = new URL(pathname, `https://${host}`);
  return new NextRequest(url, { headers: { host, "user-agent": userAgent } });
}

describe("locale middleware exemptions", () => {
  it("does not locale-prefix metadata or static files", () => {
    for (const pathname of [
      "/robots.txt",
      "/sitemap-index",
      "/sitemap/0.xml",
      "/sitemaps/index.xml",
      "/sitemaps/0.xml",
      "/manifest.webmanifest",
      "/sw.js",
      "/favicon.ico",
      "/og.png",
      "/apple-touch-icon.png",
      "/icon-192.png",
      "/icon-512.png",
      "/images/anime-placeholder.jpg",
      "/data/anime-guessr-questions.json",
      "/api/trpc/health",
    ]) {
      expect(shouldBypassLocale(pathname)).toBe(true);
      const response = middleware(request(pathname));
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("rewrites sitemap URLs to static XML without a locale redirect", () => {
    const index = middleware(request("/sitemap.xml"));
    expect(index.headers.get("location")).toBeNull();
    expect(index.headers.get("x-middleware-rewrite")).toBe(
      "https://aniguessr.ayiora.com/sitemaps/index.xml",
    );

    const child = middleware(request("/sitemap/0.xml"));
    expect(child.headers.get("location")).toBeNull();
    expect(child.headers.get("x-middleware-rewrite")).toBe(
      "https://aniguessr.ayiora.com/sitemaps/0.xml",
    );
  });

  it("does not block Googlebot on the homepage, sitemap, or spot pages", () => {
    const home = middleware(request("/", "aniguessr.ayiora.com", GOOGLEBOT));
    expect(home.status).toBe(307);
    expect(home.headers.get("location")).toBe(
      "https://aniguessr.ayiora.com/en",
    );

    const sitemap = middleware(
      request("/sitemap.xml", "aniguessr.ayiora.com", GOOGLEBOT),
    );
    expect(sitemap.status).not.toBe(429);
    expect(sitemap.headers.get("x-middleware-rewrite")).toBe(
      "https://aniguessr.ayiora.com/sitemaps/index.xml",
    );

    const spot = middleware(
      request(
        "/en/pilgrimage/spots/anitabi_1_2",
        "aniguessr.ayiora.com",
        GOOGLEBOT,
      ),
    );
    expect(spot.status).not.toBe(429);
    if (spot.status === 301) {
      expect(spot.headers.get("location") ?? "").toContain(
        "/en/pilgrimage/spots/",
      );
    } else {
      expect(spot.status).toBe(200);
      expect(spot.headers.get("location")).toBeNull();
    }
  });

  it("301s a merged anime subject id to the canonical slug", () => {
    const canonical = PILGRIMAGE_REDIRECT_MAP.animeBySubjectId["240038"];
    const movie = PILGRIMAGE_REDIRECT_MAP.animeBySubjectId["467930"];
    expect(canonical).toBeTruthy();
    expect(movie).toBe(canonical);

    const response = middleware(
      request(
        "/ja/pilgrimage/anime/467930-old-slug",
        "aniguessr.ayiora.com",
        GOOGLEBOT,
      ),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      `https://aniguessr.ayiora.com${withAnimeLocale(`/pilgrimage/anime/${canonical}`, "ja")}`,
    );

    const current = middleware(
      request(
        `/ja/pilgrimage/anime/${canonical}`,
        "aniguessr.ayiora.com",
        GOOGLEBOT,
      ),
    );
    expect(current.status).toBe(200);
    expect(current.headers.get("location")).toBeNull();
  });

  it("still redirects unprefixed pages to a locale", () => {
    const response = middleware(request("/pilgrimage"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://aniguessr.ayiora.com/en/pilgrimage",
    );
  });

  it("keeps the pilgrimage ISR window at one day", () => {
    expect(PILGRIMAGE_REVALIDATE_SECONDS).toBe(86_400);
  });

  it("serves locale-prefixed pilgrimage URLs without rewrite or Set-Cookie", () => {
    for (const pathname of [
      "/ja/pilgrimage",
      "/zh/pilgrimage/locations",
      "/en/pilgrimage/spots/anitabi_1_2",
      "/ja/pilgrimage/anime/123-title",
      "/zh-tw/pilgrimage",
      "/zh-tw/pilgrimage/locations/fujisawa-kanagawa",
      "/zh-tw/pilgrimage/locations/kamakura-kanagawa",
      "/zh-tw/pilgrimage/locations/shinjuku-tokyo",
    ]) {
      expect(isLocalePrefixedPilgrimagePath(pathname)).toBe(true);
      const response = middleware(request(pathname));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  it("does not locale-redirect /zh-tw outside pilgrimage or onto simplified", () => {
    const game = middleware(request("/zh-tw/game/anime"));
    expect(game.status).toBe(200);
    expect(game.headers.get("location")).toBeNull();
    expect(game.headers.get("x-middleware-rewrite")).toBeNull();
    expect(game.headers.get("set-cookie")).toBeNull();

    const preferred = middleware(
      new NextRequest(new URL("https://aniguessr.ayiora.com/pilgrimage"), {
        headers: {
          host: "aniguessr.ayiora.com",
          "accept-language": "zh-TW,zh;q=0.9",
        },
      }),
    );
    expect(preferred.status).toBe(307);
    expect(preferred.headers.get("location")).toBe(
      "https://aniguessr.ayiora.com/zh/pilgrimage",
    );
  });

  it("still rewrites other locale-prefixed pages", () => {
    const response = middleware(request("/ja/game/anime"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://aniguessr.ayiora.com/game/anime",
    );
    expect(response.headers.get("set-cookie")).toContain("aniguessr_locale=ja");
  });

  it("redirects the old production host with 301", () => {
    const response = middleware(
      request("/robots.txt?utm_source=x", "aniguessr.loamly.net"),
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://aniguessr.ayiora.com/robots.txt?utm_source=x",
    );
  });
});
