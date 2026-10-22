"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HOME_LANG_LINKS } from "~/lib/home-page-copy";
import { withGameLocale } from "~/lib/game-locale";
import { splitLocalePath } from "~/lib/pilgrimage-locale";

export interface LocaleMenuLink {
  locale: string;
  label: string;
  href: string;
  hrefLang: string;
}

export function hrefLangForLocale(locale: string): string {
  return locale === "zh-tw" ? "zh-Hant" : locale;
}

/** Locale-prefixed game URLs. The anchors navigate themselves and do not write a cookie. */
export function gameLocaleMenuLinks(
  pathname: string,
  search = "",
): LocaleMenuLink[] {
  const inner = splitLocalePath(pathname).pathname || "/game/anime";
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  return HOME_LANG_LINKS.map((item) => ({
    locale: item.locale,
    label: item.label,
    href: withGameLocale(`${inner}${query}`, item.locale),
    hrefLang: hrefLangForLocale(item.locale),
  }));
}

function LocaleAnchors({
  links,
  current,
}: {
  links: LocaleMenuLink[];
  current: string;
}) {
  return links.map((item) => (
    <a
      key={item.locale}
      href={item.href}
      aria-current={item.locale === current ? "true" : undefined}
      hrefLang={item.hrefLang}
    >
      {item.label}
    </a>
  ));
}

export function LocaleLinkGroup({
  className,
  label,
  locale,
  links,
}: {
  className: string;
  label: string;
  locale: string;
  links: LocaleMenuLink[];
}) {
  return (
    <div className={className} role="group" aria-label={label}>
      <LocaleAnchors links={links} current={locale} />
    </div>
  );
}

function Chevron() {
  return (
    <svg
      className="home-lang-chevron"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.2 3.6 5 6.4 7.8 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LocaleMenu({
  locale,
  label,
  links,
  rowClassName,
  onOpen,
  dismissSignal = false,
}: {
  locale: string;
  label: string;
  links: LocaleMenuLink[];
  rowClassName: string;
  onOpen?: () => void;
  dismissSignal?: boolean;
}) {
  const pathname = usePathname();
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const current = links.find((item) => item.locale === locale);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (dismissSignal) setOpen(false);
  }, [dismissSignal]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <>
      <LocaleLinkGroup
        className={rowClassName}
        label={label}
        locale={locale}
        links={links}
      />
      <div
        className="home-lang-menu"
        ref={rootRef}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && event.currentTarget.contains(next))
            return;
          setOpen(false);
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          className="home-lang-current"
          aria-expanded={open}
          aria-controls={popoverId}
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) onOpen?.();
          }}
        >
          <span className="home-lang-name">{label}</span>
          {current?.label}
          <Chevron />
        </button>
        <div
          id={popoverId}
          className="home-lang-popover"
          role="group"
          aria-label={label}
          hidden={!open}
        >
          <LocaleAnchors links={links} current={locale} />
        </div>
      </div>
    </>
  );
}
