"use client";

import { useState } from "react";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { HomeAccount } from "~/components/home/home-account";
import {
  HOME_LANG_LINKS,
  getHomePageCopy,
} from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

function homeHref(locale: HomeLocale): string {
  return locale === "zh-tw" ? "/zh-tw" : `/${locale}`;
}

export function HomeHeader({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const [open, setOpen] = useState(false);
  const links = [
    {
      href: withPilgrimageLocale("/pilgrimage", locale),
      label: copy.navMap,
    },
    {
      href: withPilgrimageLocale("/pilgrimage/anime", locale),
      label: copy.navAnime,
    },
    {
      href: withPilgrimageLocale("/pilgrimage/locations", locale),
      label: copy.navAreas,
    },
    { href: "#game", label: copy.navGame },
    { href: "#rank", label: copy.navRank },
  ];
  const current = HOME_LANG_LINKS.find((item) => item.locale === locale);

  return (
    <header className="home-hdr">
      <div className="home-hdr-in">
        <BrandLockup href={homeHref(locale)} />
        <nav className="home-nav" aria-label={copy.navMap}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="home-hdr-right">
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            {HOME_LANG_LINKS.map((item) => (
              <a
                key={item.locale}
                href={homeHref(item.locale)}
                aria-current={item.locale === locale ? "true" : undefined}
                hrefLang={item.locale === "zh-tw" ? "zh-Hant" : item.locale}
              >
                {item.label}
              </a>
            ))}
          </div>
          <span className="home-lang-current">{current?.label}</span>
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
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            {HOME_LANG_LINKS.map((item) => (
              <a
                key={item.locale}
                href={homeHref(item.locale)}
                aria-current={item.locale === locale ? "true" : undefined}
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
