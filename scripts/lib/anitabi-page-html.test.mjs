import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const LOCALES = ["ja", "zh", "zh-tw", "en"];
const INDEX_PATH = path.join(process.cwd(), "public/data/seo/index.json");
const SPOT_ID = "anitabi_37137_4slhba842";
const WORK_SLUG = "51-clannad";
const REGION_SLUG = "shibuya-tokyo";

const UI_SOURCES = [
  "src/components/home/home-footer.tsx",
  "src/app/[locale]/pilgrimage/_components/pilgrimage-ui.tsx",
  "src/app/[locale]/pilgrimage/spots/[id]/page.tsx",
  "src/app/[locale]/pilgrimage/anime/[slug]/page.tsx",
  "src/app/[locale]/pilgrimage/locations/[slug]/page.tsx",
  "src/app/[locale]/(home)/page.tsx",
];

function ensurePilgrimageSeoIndex() {
  if (existsSync(INDEX_PATH)) return;
  execFileSync(process.execPath, ["scripts/build-pilgrimage-seo-data.mjs"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
}

function visibleAnitabiMentions(html) {
  const withoutAllowed = html
    .replace(/https?:\/\/anitabi\.cn[^\s"'<>]*/gi, "")
    .replace(/\banitabi_\d+_[\w-]+/gi, "");
  return withoutAllowed.match(/\banitabi\b/gi) ?? [];
}

function assertNoVisibleAnitabi(html, label) {
  expect(visibleAnitabiMentions(html), `${label} still contains visible anitabi`).toEqual(
    [],
  );
}

function renderShellMarkup() {
  const script = `
    import React from "react";
    globalThis.React = React;
    import { renderToStaticMarkup } from "react-dom/server";
    import { HomeFooter } from "./src/components/home/home-footer.tsx";
    import { PilgrimageShell } from "./src/app/[locale]/pilgrimage/_components/pilgrimage-ui.tsx";
    const locales = ${JSON.stringify(LOCALES)};
    const out = { homeFooter: {}, pilgrimageShell: {} };
    for (const locale of locales) {
      out.homeFooter[locale] = renderToStaticMarkup(React.createElement(HomeFooter, { locale }));
      out.pilgrimageShell[locale] = renderToStaticMarkup(
        React.createElement(
          PilgrimageShell,
          { locale, kicker: "k", title: "t" },
          React.createElement("p", null, "body"),
        ),
      );
    }
    process.stdout.write(JSON.stringify(out));
  `;
  return JSON.parse(
    execFileSync("npx", ["tsx", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  );
}

function spotPageHtml(spot, locale) {
  const pick = (field) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[locale] ?? field.en ?? field.zh ?? field.ja ?? "";
  };
  const facts = Array.isArray(spot.funfact)
    ? spot.funfact.map((item) => pick(item))
    : pick(spot.funfact);
  return [
    pick(spot.title),
    pick(spot.description),
    pick(spot.episodeContext),
    ...(Array.isArray(facts) ? facts : [facts]),
    pick(spot.animeTitle),
    pick(spot.location),
    pick(spot.answerName),
    spot.id,
  ].join("\n");
}

describe("rendered pilgrimage HTML has no visible anitabi credit", () => {
  beforeAll(() => {
    ensurePilgrimageSeoIndex();
  });

  it("keeps attribution components and outbound credits out of UI source", () => {
    for (const file of UI_SOURCES) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("AnitabiAttribution");
      expect(source).not.toMatch(/https:\/\/anitabi\.cn/i);
      expect(source).not.toMatch(/>anitabi</i);
    }
  });

  it("renders the home footer and pilgrimage shell markup without anitabi", () => {
    const markup = renderShellMarkup();
    for (const locale of LOCALES) {
      assertNoVisibleAnitabi(markup.homeFooter[locale], `home footer (${locale})`);
      assertNoVisibleAnitabi(
        markup.pilgrimageShell[locale],
        `pilgrimage shell (${locale})`,
      );
    }
  });

  it("renders spot, work, and region page copy for every locale without anitabi", () => {
    const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
    const spot = index.spots[SPOT_ID];
    expect(spot).toBeTruthy();
    const work = index.animes.find((item) => item.slug === WORK_SLUG);
    expect(work).toBeTruthy();
    const region = index.locations.find((item) => item.slug === REGION_SLUG);
    expect(region).toBeTruthy();

    for (const locale of LOCALES) {
      assertNoVisibleAnitabi(spotPageHtml(spot, locale), `spot page (${locale})`);
      assertNoVisibleAnitabi(
        JSON.stringify({
          title: work.animeTitle,
          spots: Object.values(index.spots)
            .filter((item) => item.subjectSlug === WORK_SLUG)
            .slice(0, 12)
            .map((item) => spotPageHtml(item, locale)),
        }),
        `work page (${locale})`,
      );
      assertNoVisibleAnitabi(
        JSON.stringify({
          title: region.name,
          spots: Object.values(index.spots)
            .filter((item) => item.locationSlug === REGION_SLUG)
            .slice(0, 12)
            .map((item) => spotPageHtml(item, locale)),
        }),
        `region page (${locale})`,
      );
      assertNoVisibleAnitabi(
        JSON.stringify({
          footer: "home",
          featured: index.animes.slice(0, 8).map((item) => item.animeTitle),
        }),
        `home page (${locale})`,
      );
    }

    expect(spotPageHtml(spot, "ja")).toContain(SPOT_ID);
  });
});
