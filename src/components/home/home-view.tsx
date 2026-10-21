import { AreaMiniMap, ANIME_GLYPH_COLORS } from "~/components/home/area-mini-map";
import { HomeFooter } from "~/components/home/home-footer";
import { HomeGamePanel } from "~/components/home/home-game-panel";
import { HomeHeader } from "~/components/home/home-header";
import { HomeLeaderboard } from "~/components/home/home-leaderboard";
import { HomeLocate } from "~/components/home/home-locate";
import { HomeMapLoader } from "~/components/home/home-map-loader";
import { HomeNearby } from "~/components/home/home-nearby";
import { HomeStructuredData } from "~/components/HomeStructuredData";
import type { HomeCatalog } from "~/lib/home-catalog";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

function formatCount(locale: HomeLocale, value: number): string {
  return value.toLocaleString(locale === "zh-tw" ? "zh-TW" : locale);
}

export function HomeView({
  locale,
  catalog,
}: {
  locale: HomeLocale;
  catalog: HomeCatalog;
}) {
  const copy = getHomePageCopy(locale);
  const pilgrimageHref = withPilgrimageLocale("/pilgrimage", locale);
  const nearbyHref = withPilgrimageLocale("/pilgrimage#nearby", locale);
  const htmlLang = locale === "zh-tw" ? "zh-Hant" : locale;

  return (
    <main className="home" data-locale={locale} lang={htmlLang}>
      <HomeStructuredData locale={locale} />
      <HomeLocate message={copy.geoDenied} />
      <HomeHeader locale={locale} />
      <section className="home-hero" id="pilgrim">
        <div className="home-mapstage">
          <HomeMapLoader locale={locale} />
          <div className="home-overlay" aria-hidden="true">
            <p className="home-chip">
              <i />
              {copy.chip}
            </p>
            <p className="home-h1">
              <span className="home-h1-line">
                {copy.h1Lead}
                <span className="home-accent">{copy.h1Accent}</span>
              </span>
              <span className="home-h1-line">{copy.h1Tail}</span>
            </p>
          </div>
          <div className="home-pills">
            <a href={withPilgrimageLocale("/pilgrimage/anime", locale)}>
              {copy.searchPill}
            </a>
            <a href={withPilgrimageLocale("/pilgrimage#favorites", locale)}>
              {copy.favoritesPill}
            </a>
          </div>
          <HomeNearby
            locale={locale}
            variant="panel"
            seeds={catalog.nearby}
            popularLocationSlugs={catalog.popularLocationSlugs}
          />
          <HomeNearby
            locale={locale}
            variant="sheet"
            seeds={catalog.nearby}
            popularLocationSlugs={catalog.popularLocationSlugs}
          />
        </div>
        <div className="home-copy">
          <p className="home-chip">
            <i />
            {copy.chip}
          </p>
          <h1 className="home-h1">
            <span className="home-h1-line">
              {copy.h1Lead}
              <span className="home-accent">{copy.h1Accent}</span>
            </span>
            <span className="home-h1-line">{copy.h1Tail}</span>
          </h1>
          <p className="home-intro">{copy.intro}</p>
          <div className="home-ctas">
            <a className="home-btn home-btn-primary" data-find-nearby="" href={nearbyHref}>
              {copy.primaryCta}
            </a>
            <a className="home-btn home-btn-secondary" href={pilgrimageHref}>
              {copy.secondaryCta}
            </a>
          </div>
          <p className="home-privacy home-privacy-desk">
            <span>{copy.privacy}</span>
          </p>
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
            <a className="home-more" href={withPilgrimageLocale("/pilgrimage/locations", locale)}>
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
            <a className="home-more" href={withPilgrimageLocale("/pilgrimage/anime", locale)}>
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
                  <small>{copy.animeMeta(anime.spotCount, anime.areaName)}</small>
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

      <HomeLeaderboard locale={locale} />
      <HomeFooter locale={locale} />
    </main>
  );
}
