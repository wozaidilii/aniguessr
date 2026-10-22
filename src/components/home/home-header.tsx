"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setHomeMapActive } from "~/components/home/home-events";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { HomeAccount } from "~/components/home/home-account";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import {
  siteNavIsCurrent,
  siteNavModel,
  type SiteNavLanguage,
  type SiteNavLink,
} from "~/lib/site-nav";

function hashId(href: string): string {
  return href.split("#")[1] ?? "";
}

function hrefLang(locale: HomeLocale): string {
  return locale === "zh-tw" ? "zh-Hant" : locale;
}

function LanguageAnchors({
  languages,
  locale,
}: {
  languages: SiteNavLanguage[];
  locale: HomeLocale;
}) {
  return languages.map((item) => (
    <a
      key={item.locale}
      href={item.href}
      aria-current={item.locale === locale ? "true" : undefined}
      hrefLang={hrefLang(item.locale)}
    >
      {item.label}
    </a>
  ));
}

function pathOnly(href: string): string {
  return href.split("#")[0] ?? "";
}

export function HomeHeader({ locale }: { locale: HomeLocale }) {
  const copy = getHomePageCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const nav = siteNavModel(pathname, locale);
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<SiteNavLink["id"] | null>(null);
  const [hash, setHash] = useState("");
  const navRef = useRef<HTMLElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const langButtonRef = useRef<HTMLButtonElement | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [bar, setBar] = useState({ x: 0, width: 0, visible: false });
  const labels = {
    anime: copy.navAnime,
    areas: copy.navAreas,
    game: copy.navGame,
    rank: copy.navRank,
  } as const;
  const currentLang = nav.languages.find((item) => item.locale === locale);

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    setPendingId(null);
    setLangOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    if (!langOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setLangOpen(false);
      langButtonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && langRef.current?.contains(target)) return;
      setLangOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [langOpen]);

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, [pathname]);

  function active(link: SiteNavLink): boolean {
    if (pendingId) return pendingId === link.id;
    const id = hashId(link.href);
    if (id) return hash === `#${id}`;
    return siteNavIsCurrent(pathname, link.href);
  }

  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root) return;
    const current = root.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) {
      setBar((prev) => ({ ...prev, visible: false }));
      return;
    }
    setBar({
      x: current.offsetLeft,
      width: current.offsetWidth,
      visible: true,
    });
  }, [pathname, hash, pendingId, locale, open]);

  function onPointerDown(id: SiteNavLink["id"], href: string) {
    setPendingId(id);
    if (
      !href.startsWith("#") &&
      !href.endsWith("#game") &&
      !href.endsWith("#rank")
    ) {
      setHomeMapActive(false);
    }
  }

  function prefetch(href: string) {
    const path = pathOnly(href);
    if (path.startsWith("/")) router.prefetch(path);
  }

  function onTabClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    link: SiteNavLink,
  ) {
    const id = hashId(link.href);
    if (!id) return;
    if (pathOnly(link.href) && pathOnly(link.href) !== pathname) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    const next = `${pathname}#${id}`;
    window.history.pushState(null, "", next);
    setHash(`#${id}`);
  }

  return (
    <header className="home-hdr" data-testid="site-header">
      <div className="home-hdr-in">
        <div className="home-hdr-left">
          <BrandLockup href={nav.home} />
          <nav className="home-nav" aria-label={copy.menu} ref={navRef}>
            {nav.links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                prefetch
                aria-current={active(link) ? "page" : undefined}
                onPointerDown={() => onPointerDown(link.id, link.href)}
                onMouseEnter={() => prefetch(link.href)}
                onFocus={() => prefetch(link.href)}
                onClick={(event) => onTabClick(event, link)}
              >
                {labels[link.id]}
              </Link>
            ))}
            <span
              className="home-nav-underline"
              data-visible={bar.visible ? "true" : "false"}
              style={{ width: bar.width, transform: `translateX(${bar.x}px)` }}
            />
          </nav>
        </div>
        <div className="home-hdr-right">
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            <LanguageAnchors languages={nav.languages} locale={locale} />
          </div>
          <div
            className="home-lang-menu"
            ref={langRef}
            onBlur={(event) => {
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.contains(next))
                return;
              setLangOpen(false);
            }}
          >
            <button
              ref={langButtonRef}
              type="button"
              className="home-lang-current"
              aria-expanded={langOpen}
              aria-controls="home-lang-popover"
              onClick={() => {
                setLangOpen((value) => !value);
                setOpen(false);
              }}
            >
              <span className="home-lang-name">{copy.langLabel}</span>
              {currentLang?.label}
            </button>
            <div
              id="home-lang-popover"
              className="home-lang-popover"
              role="group"
              aria-label={copy.langLabel}
              hidden={!langOpen}
            >
              <LanguageAnchors languages={nav.languages} locale={locale} />
            </div>
          </div>
          <div className="home-hdr-login">
            <HomeAccount locale={locale} />
          </div>
          <button
            type="button"
            className="home-burger"
            aria-expanded={open}
            aria-label={open ? copy.closeMenu : copy.menu}
            onClick={() => {
              setOpen((value) => !value);
              setLangOpen(false);
            }}
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
            <Link
              key={link.id}
              href={link.href}
              prefetch
              aria-current={active(link) ? "page" : undefined}
              onPointerDown={() => onPointerDown(link.id, link.href)}
              onClick={(event) => {
                onTabClick(event, link);
                setOpen(false);
              }}
            >
              {labels[link.id]}
            </Link>
          ))}
          <div className="home-lang" role="group" aria-label={copy.langLabel}>
            <LanguageAnchors languages={nav.languages} locale={locale} />
          </div>
          <HomeAccount locale={locale} />
        </div>
      ) : null}
    </header>
  );
}
