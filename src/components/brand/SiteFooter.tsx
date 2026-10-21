import Link from "next/link";
import { ArrowIcon } from "~/components/brand/ArrowIcon";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { RightsContactLink } from "~/components/rights-contact-link";
import { COMPANY_SITE_URL, HOME_COPY } from "~/lib/aniguessr-copy";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";

export function SiteFooter({ locale }: { locale: AnimeLocale }) {
  const copy = HOME_COPY[locale];
  const homeHref = withAnimeLocale("/", locale);
  const battleHref = withAnimeLocale("/battle", locale);

  return (
    <footer className="ag-ftr">
      <div className="ag-wrap">
        <div className="ag-ftr-row">
          <div>
            <BrandLockup href={homeHref} />
            <p className="ag-ftr-blurb">{copy.footerBlurb}</p>
            <a className="ag-ftr-back" href={COMPANY_SITE_URL}>
              {copy.footerBack} <ArrowIcon />
            </a>
          </div>
          <div className="ag-ftr-cols">
            <div>
              <h2>{copy.footerGame}</h2>
              <ul>
                <li>
                  <Link href={`${homeHref}#how`}>{copy.navHow}</Link>
                </li>
                <li>
                  <Link href={`${homeHref}#rank`}>{copy.navRank}</Link>
                </li>
                <li>
                  <Link href={battleHref}>{copy.navBattle}</Link>
                </li>
                <li>
                  <Link href={homeHref}>{copy.navPilgrimage}</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>{copy.footerBrand}</h2>
              <ul>
                <li>
                  <Link href={`${homeHref}#contact`}>{copy.navContact}</Link>
                </li>
                <li>
                  <Link href={withAnimeLocale("/privacy", locale)}>
                    {copy.footerPrivacy}
                  </Link>
                </li>
                <li>
                  <RightsContactLink locale={locale} />
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="ag-ftr-copy">
          <span>{copy.footerCopy}</span>
          <span>aniguessr.ayiora.com</span>
        </div>
      </div>
    </footer>
  );
}
