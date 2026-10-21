"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { HomeAccount } from "~/components/home/home-account";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { siteNavIsCurrent, siteNavModel } from "~/lib/site-nav";

export function HomeHeader({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const nav = siteNavModel(pathname, locale);
  const [open, setOpen] = useState(false);
  const labels = {
    anime: copy.navAnime,
    areas: copy.navAreas,
    game: copy.navGame,
    rank: copy.navRank,
  } as const;
  const currentLang = nav.languages.find((item) => item.locale === locale);

  return (
    <header className="home-hdr" data-testid="site-header">
      <div className="home-hdr-in">
        <div className="home-hdr-left">
          <BrandLockup href={nav.home} />
          <nav className="home-nav" aria-label={copy.menu}>
            {nav.links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                aria-current={
                  siteNavIsCurrent(pathname, link.href) ? "page" : undefined
                }
              >
                {labels[link.id]}
              </a>
            ))}
          </nav>
        </div>
        <div className="home-hdr-right">
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            {nav.languages.map((item) => (
              <a
                key={item.locale}
                href={item.href}
                aria-current={item.locale === locale ? "true" : undefined}
                hrefLang={item.locale === "zh-tw" ? "zh-Hant" : item.locale}
              >
                {item.label}
              </a>
            ))}
          </div>
          <span className="home-lang-current">{currentLang?.label}</span>
          <div className="home-hdr-login">
            <HomeAccount locale={locale} />
          </div>
          <button
            type="button"
            className="home-burger"
            aria-expanded={open}
            aria-label={open ? copy.closeMenu : copy.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </div>
      {open ? (
        <div className="home-sheet-nav">
          {nav.links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              aria-current={
                siteNavIsCurrent(pathname, link.href) ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              {labels[link.id]}
            </a>
          ))}
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            {nav.languages.map((item) => (
              <a
                key={item.locale}
                href={item.href}
                aria-current={item.locale === locale ? "true" : undefined}
                hrefLang={item.locale === "zh-tw" ? "zh-Hant" : item.locale}
              >
                {item.label}
              </a>
            ))}
          </div>
          <HomeAccount locale={locale} />
        </div>
      ) : null}
    </header>
  );
}
