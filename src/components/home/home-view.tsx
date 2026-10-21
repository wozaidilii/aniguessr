import {
  AreaMiniMap,
  ANIME_GLYPH_COLORS,
} from "~/components/home/area-mini-map";
import { HomeFooter } from "~/components/home/home-footer";
import { HomeGamePanel } from "~/components/home/home-game-panel";
import { HomeLocate } from "~/components/home/home-locate";
import { HomeNearby } from "~/components/home/home-nearby";
import { HomeWorkSearch } from "~/components/home/home-work-search";
import { HomeStructuredData } from "~/components/HomeStructuredData";
import type { HomeCatalog } from "~/lib/home-catalog";
import type { PopularAnimeChip } from "~/lib/popular-anime";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

function formatCount(locale: HomeLocale, value: number): string {
  return value.toLocaleString(locale === "zh-tw" ? "zh-TW" : locale);
}

function HomeTitle({
  locale,
  copy,
  as,
}: {
  locale: HomeLocale;
  copy: ReturnType<typeof getHomePageCopy>;
  as: "h1" | "p";
}) {
  const Tag = as;
  return (
    <Tag className="home-h1">
      <span className="home-h1-line">
        {copy.h1Lead}
        <span className="home-accent">{copy.h1Accent}</span>
      </span>
      {locale === "en" ? " " : null}
      <span className="home-h1-line">{copy.h1Tail}</span>
    </Tag>
  );
}

export function HomeView({
  locale,
  catalog,
  popularAnime,
}: {
  locale: HomeLocale;
  catalog: HomeCatalog;
  popularAnime: PopularAnimeChip[];
}) {
  const copy = getHomePageCopy(locale);
  const nearbyHref = withPilgrimageLocale("/", locale);
  const htmlLang = locale === "zh-tw" ? "zh-Hant" : locale;

  return (
    <main className="home" data-locale={locale} lang={htmlLang}>
      <HomeStructuredData locale={locale} />
      <HomeLocate message={copy.geoDenied} />
      <section className="home-hero" id="pilgrim">
        <div className="home-mapbar">
          <HomeTitle locale={locale} copy={copy} as="h1" />
          <dl className="home-stats">
            <div>
              <dd>{formatCount(locale, catalog.spotCount)}</dd>
              <dt>{copy.statSpots}</dt>
            </div>
            <div>
              <dd>{formatCount(locale, catalog.animeCount)}</dd>
              <dt>{copy.statAnime}</dt>
            </div>
            <div>
              <dd>{formatCount(locale, catalog.locationCount)}</dd>
              <dt>{copy.statAreas}</dt>
            </div>
          </dl>
          <a
            className="home-btn home-btn-primary"
            data-find-nearby=""
            href={nearbyHref}
          >
            {copy.primaryCta}
          </a>
        </div>
        <div className="home-mapstage">
          <div id="home-map-slot" className="home-map-slot" />
          <div className="home-map-float">
            <div className="home-map-searchstack">
              <HomeWorkSearch locale={locale} popular={popularAnime} />
            </div>
          </div>
          <HomeNearby locale={locale} variant="panel" />
          <HomeNearby locale={locale} variant="sheet" />
        </div>
      </section>

      <section className="home-sec" id="areas">
        <div className="home-wrap">
          <div className="home-sec-h">
            <div>
              <p className="home-eyebrow">{copy.areasEyebrow}</p>
              <h2>{copy.areasTitle}</h2>
              <p>{copy.areasSubtitle}</p>
            </div>
            <a
              className="home-more"
              href={withPilgrimageLocale("/pilgrimage/locations", locale)}
            >
              {copy.areasAll}
            </a>
          </div>
          <div className="home-areas">
            {catalog.areas.map((area) => (
              <a key={area.slug} className="home-area" href={area.href}>
                <AreaMiniMap pins={area.pins} tone={area.tone} />
                <span>
                  <b>{area.name}</b>
                  <small>{copy.spotCount(area.spotCount)}</small>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="home-sec" id="series">
        <div className="home-wrap">
          <div className="home-sec-h">
            <div>
              <p className="home-eyebrow">{copy.animeEyebrow}</p>
              <h2>{copy.animeTitle}</h2>
              <p>{copy.animeSubtitle}</p>
            </div>
            <a
              className="home-more"
              href={withPilgrimageLocale("/pilgrimage/anime", locale)}
            >
              {copy.animeAll}
            </a>
          </div>
          <div className="home-works">
            {catalog.animeCards.map((anime) => (
              <a key={anime.slug} className="home-work" href={anime.href}>
                <span
                  className="home-glyph"
                  style={{ background: ANIME_GLYPH_COLORS[anime.tone] }}
                >
                  {anime.glyph}
                </span>
                <span>
                  <b>{anime.title}</b>
                  <small>
                    {copy.animeMeta(anime.spotCount, anime.areaName)}
                  </small>
                </span>
              </a>
            ))}
          </div>
          <div className="home-tags">
            {catalog.animeTags.map((tag) => (
              <a key={tag.slug} href={tag.href}>
                {tag.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="home-sec" id="how">
        <div className="home-wrap">
          <div className="home-sec-h">
            <div>
              <p className="home-eyebrow">{copy.howEyebrow}</p>
              <h2>{copy.howTitle}</h2>
              <p>{copy.howSubtitle}</p>
            </div>
          </div>
          <ol className="home-steps">
            {copy.steps.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="home-privacy">{copy.privacy}</p>
        </div>
      </section>

      <section className="home-game" id="game">
        <div className="home-wrap home-game-grid">
          <div>
            <p className="home-eyebrow">{copy.gameEyebrow}</p>
            <h2>{copy.gameTitle}</h2>
            <p className="home-intro">{copy.gameBody}</p>
          </div>
          <HomeGamePanel locale={locale} />
        </div>
      </section>

      <HomeFooter locale={locale} />
    </main>
  );
}
