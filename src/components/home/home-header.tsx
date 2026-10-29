"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setHomeMapActive } from "~/components/home/home-events";
import { BrandLockup } from "~/components/brand/BrandLockup";
import {
  hrefLangForLocale,
  LocaleLinkGroup,
  LocaleMenu,
  type LocaleMenuLink,
} from "~/components/brand/LocaleMenu";
import { HomeAccount } from "~/components/home/home-account";
import { getHomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import {
  siteNavIsCurrent,
  siteNavModel,
  type SiteNavLink,
} from "~/lib/site-nav";

function hashId(href: string): string {
  return href.split("#")[1] ?? "";
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
  const [accountDismiss, setAccountDismiss] = useState(0);
  const [localeDismiss, setLocaleDismiss] = useState(0);
  const [pendingId, setPendingId] = useState<SiteNavLink["id"] | null>(null);
  const [hash, setHash] = useState("");
  const navRef = useRef<HTMLElement | null>(null);
  const [bar, setBar] = useState({ x: 0, width: 0, visible: false });
  const labels = {
    anime: copy.navAnime,
    areas: copy.navAreas,
    game: copy.navGame,
    rank: copy.navRank,
  } as const;
  const localeLinks: LocaleMenuLink[] = nav.languages.map((item) => ({
    locale: item.locale,
    label: item.label,
    href: item.href,
    hrefLang: hrefLangForLocale(item.locale),
  }));
  const rankHref = nav.links.find((link) => link.id === "rank")?.href ?? "#rank";

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    setPendingId(null);
  }, [pathname, hash]);

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

  function toggleDrawer() {
    setOpen((value) => {
      const next = !value;
      if (next) {
        setAccountDismiss((value) => value + 1);
        setLocaleDismiss((value) => value + 1);
      }
      return next;
    });
  }

  function onLocaleOpen() {
    setAccountDismiss((value) => value + 1);
  }

  function onAccountOpen() {
    setLocaleDismiss((value) => value + 1);
    if (open) setOpen(false);
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
          <LocaleMenu
            locale={locale}
            label={copy.langLabel}
            links={localeLinks}
            rowClassName="home-lang"
            menuClassName="home-hdr-lang"
            ssrOnlyLinks
            onOpen={onLocaleOpen}
            dismissSignal={localeDismiss}
          />
          <div className="home-hdr-login">
            <HomeAccount
              locale={locale}
              rankHref={rankHref}
              onOpen={onAccountOpen}
              dismissSignal={accountDismiss}
            />
          </div>
          <button
            type="button"
            className="home-burger"
            aria-expanded={open}
            aria-label={open ? copy.closeMenu : copy.menu}
            onClick={toggleDrawer}
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
          <hr className="home-menu-divider home-sheet-lang-divider" />
          <p className="home-sheet-lang-label">{copy.langLabel}</p>
          <LocaleLinkGroup
            className="home-lang home-sheet-lang"
            label={copy.langLabel}
            locale={locale}
            links={localeLinks}
          />
        </div>
      ) : null}
    </header>
  );
}
