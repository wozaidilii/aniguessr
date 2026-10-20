"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { LangSwitch } from "~/components/brand/LangSwitch";
import { HOME_COPY } from "~/lib/aniguessr-copy";
import { withAnimeLocale, type AnimeLocale } from "~/lib/anime-locale";

export function SiteHeader({
  locale,
  onSelectLocale,
  action,
}: {
  locale: AnimeLocale;
  onSelectLocale: (locale: AnimeLocale) => void;
  action?: ReactNode;
}) {
  const copy = HOME_COPY[locale];
  const homeHref = withAnimeLocale("/", locale);
  const [open, setOpen] = useState(false);
  const links = [
    { href: `${homeHref}#how`, label: copy.navHow },
    { href: `${homeHref}#rank`, label: copy.navRank },
    { href: `${homeHref}#pilgrim`, label: copy.navPilgrimage },
    { href: `${homeHref}#contact`, label: copy.navContact },
  ];

  return (
    <header className="ag-hdr">
      <div className="ag-hdr-in">
        <BrandLockup href={homeHref} />
        <nav className="ag-hdr-nav" aria-label={copy.navHow}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ag-hdr-right">
          <LangSwitch locale={locale} onSelect={onSelectLocale} />
          <div className="ag-hdr-action ag-hide-sm">{action}</div>
          <button
            type="button"
            className="ag-burger"
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
      {open && (
        <div className="ag-hdr-sheet">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div onClick={() => setOpen(false)}>{action}</div>
        </div>
      )}
    </header>
  );
}
