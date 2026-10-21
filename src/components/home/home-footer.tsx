import { AnitabiAttribution } from "~/components/anitabi-attribution";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { RightsContactLink } from "~/components/rights-contact-link";
import {
  CONTACT_GENERAL_EMAIL,
  CONTACT_SUPPORT_EMAIL,
} from "~/lib/aniguessr-copy";
import { getHomePageCopy } from "~/lib/home-page-copy";
import { homeSiteLocale, type HomeLocale } from "~/lib/home-locale";
import { withAnimeLocale } from "~/lib/anime-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

function homeHref(locale: HomeLocale): string {
  return locale === "zh-tw" ? "/zh-tw" : `/${locale}`;
}

export function HomeFooter({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const siteLocale = homeSiteLocale(locale);
  return (
    <footer className="home-ftr" id="contact">
      <div className="home-wrap home-ftr-grid">
        <div>
          <BrandLockup href={homeHref(locale)} />
          <p className="home-ftr-tag">{copy.footerTagline}</p>
        </div>
        <div className="home-ftr-cols">
          <div>
            <h2>{copy.footerMap}</h2>
            <ul>
              <li>
                <a href={withPilgrimageLocale("/pilgrimage/anime", locale)}>
                  {copy.navAnime}
                </a>
              </li>
              <li>
                <a href={withPilgrimageLocale("/pilgrimage/locations", locale)}>
                  {copy.navAreas}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2>{copy.footerGame}</h2>
            <ul>
              <li>
                <a href="#game">{copy.navGame}</a>
              </li>
              <li>
                <a href={withAnimeLocale("/battle", siteLocale)}>
                  {copy.gameBattle}
                </a>
              </li>
              <li>
                <a href="#rank">{copy.navRank}</a>
              </li>
            </ul>
          </div>
          <div>
            <h2>{copy.footerBrand}</h2>
            <ul>
              <li>
                <a href={`mailto:${CONTACT_GENERAL_EMAIL}`}>
                  {copy.contactGeneral}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_SUPPORT_EMAIL}`}>
                  {copy.contactSupport}
                </a>
              </li>
              <li>
                <a href={withPilgrimageLocale("/privacy", locale)}>
                  {copy.footerPrivacy}
                </a>
              </li>
              <li>
                <RightsContactLink locale={locale} />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="home-wrap home-ftr-bottom">
        <AnitabiAttribution locale={locale} className="home-credit" />
        <p className="home-copyline">{copy.footerCopy}</p>
      </div>
    </footer>
  );
}
