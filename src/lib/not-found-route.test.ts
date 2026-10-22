import path from "node:path";
import { describe, expect, it } from "vitest";
import { notFoundDocumentCandidates } from "~/lib/not-found-document";
import {
  freezeNotFoundDocument,
  isLocaleAppRoute,
  missingPilgrimageShell,
} from "~/lib/not-found-route";

describe("missingPilgrimageShell", () => {
  it("keeps a real work and area on their pages", () => {
    expect(
      missingPilgrimageShell("/ja/pilgrimage/anime/294993-咒术回战"),
    ).toBeNull();
    expect(
      missingPilgrimageShell("/ja/pilgrimage/locations/kamakura-kanagawa"),
    ).toBeNull();
    expect(missingPilgrimageShell("/ja/pilgrimage/anime")).toBeNull();
  });

  it("keeps a real spot page and sends a bogus id to the shell", () => {
    expect(
      missingPilgrimageShell("/ja/pilgrimage/spots/anitabi_37137_4slhba842"),
    ).toBeNull();
    expect(
      missingPilgrimageShell("/en/pilgrimage/spots/not-a-real-spot-404"),
    ).toBe("/not-found-shell/en");
    expect(
      missingPilgrimageShell("/zh-tw/pilgrimage/spots/not-a-real-spot-404"),
    ).toBe("/not-found-shell/zh-tw");
  });

  it("sends unknown work and area slugs to the styled shell", () => {
    expect(missingPilgrimageShell("/ja/pilgrimage/anime/does-not-exist")).toBe(
      "/not-found-shell/ja",
    );
    expect(
      missingPilgrimageShell("/en/pilgrimage/locations/does-not-exist"),
    ).toBe("/not-found-shell/en");
    expect(
      missingPilgrimageShell("/zh-tw/pilgrimage/anime/does-not-exist"),
    ).toBe("/not-found-shell/zh-tw");
  });
});

describe("isLocaleAppRoute", () => {
  it("keeps the game and login routes on the app rewrite", () => {
    expect(isLocaleAppRoute("/game/anime")).toBe(true);
    expect(isLocaleAppRoute("/battle/room")).toBe(true);
    expect(isLocaleAppRoute("/login")).toBe(true);
    expect(isLocaleAppRoute("/xyz")).toBe(false);
  });
});

describe("notFoundDocumentCandidates", () => {
  it("reads the prerender first and the traced asset second", () => {
    expect(notFoundDocumentCandidates("ja", "/app")).toEqual([
      path.join("/app", ".next/server/app/ja/http-404.html"),
      path.join("/app", "assets/not-found-shell/ja.html"),
    ]);
  });
});

describe("freezeNotFoundDocument", () => {
  it("keeps stylesheet links and removes scripts", () => {
    const html = `<head><link rel="preload" as="script" href="/a.js"/><link rel="stylesheet" href="/_next/static/css/site.css"/><script src="/b.js"></script><script>self.__next_f=1</script></head><body><a class="anime-button">home</a></body>`;
    const frozen = freezeNotFoundDocument(html);
    expect(frozen).toContain('rel="stylesheet"');
    expect(frozen).toContain("anime-button");
    expect(frozen).not.toContain("<script");
    expect(frozen).not.toContain('as="script"');
  });

  it("leaves exactly one noindex robots meta", () => {
    const html = `<head><meta name="robots" content="index, follow"/><meta name="googlebot" content="index, follow"/><meta name="robots" content="noindex, nofollow"/></head>`;
    const frozen = freezeNotFoundDocument(html);
    const robots = frozen.match(/<meta\b[^>]*name="robots"[^>]*>/gi) ?? [];
    expect(robots).toEqual(['<meta name="robots" content="noindex"/>']);
    expect(frozen).not.toContain("googlebot");
    expect(frozen).not.toContain("index, follow");
  });
});
