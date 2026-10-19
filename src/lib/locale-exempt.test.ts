import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { shouldBypassLocale } from "~/lib/locale-exempt";
import { middleware } from "~/middleware";

function request(pathname: string, host = "aniguessr.ayiora.com") {
  const url = new URL(pathname, `https://${host}`);
  return new NextRequest(url, { headers: { host } });
}

describe("locale middleware exemptions", () => {
  it("does not locale-prefix metadata or static files", () => {
    for (const pathname of [
      "/robots.txt",
      "/sitemap-index",
      "/sitemap/0.xml",
      "/manifest.webmanifest",
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

  it("rewrites /sitemap.xml to the index route without a locale redirect", () => {
    const response = middleware(request("/sitemap.xml"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://aniguessr.ayiora.com/sitemap-index",
    );
  });

  it("still redirects unprefixed pages to a locale", () => {
    const response = middleware(request("/pilgrimage"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://aniguessr.ayiora.com/en/pilgrimage",
    );
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
