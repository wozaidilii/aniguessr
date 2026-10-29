"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { type GameLocaleMenuLink } from "~/lib/game-locale";
import { isHomeLocale } from "~/lib/home-locale";
import { localeNativeName } from "~/lib/locale-native-names";
import { isEscapeKey } from "~/lib/menu-dismiss";
import {
  anchorBelowTriggerRight,
  isOutsideOverlayNodes,
} from "~/lib/overlay-portal";

export type LocaleMenuLink = GameLocaleMenuLink;

export { gameLocaleMenuLinks, hrefLangForLocale } from "~/lib/game-locale";

const LANG_POPOVER_WIDTH = 208;

function LocaleAnchors({
  links,
  current,
  menuMode = false,
}: {
  links: LocaleMenuLink[];
  current: string;
  menuMode?: boolean;
}) {
  return links.map((item) => {
    const checked = item.locale === current;
    const nativeName = isHomeLocale(item.locale)
      ? localeNativeName(item.locale)
      : item.label;
    return (
      <a
        key={item.locale}
        href={item.href}
        role={menuMode ? "menuitemradio" : undefined}
        aria-checked={menuMode ? checked : undefined}
        aria-current={checked ? "true" : undefined}
        hrefLang={item.hrefLang}
      >
        {menuMode ? nativeName : item.label}
        {menuMode && checked ? (
          <svg
            className="home-lang-check"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4.5 9.2 7.4 12.1 13.5 5.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </a>
    );
  });
}

export function LocaleLinkGroup({
  className,
  label,
  locale,
  links,
  ssrOnly = false,
}: {
  className: string;
  label: string;
  locale: string;
  links: LocaleMenuLink[];
  ssrOnly?: boolean;
}) {
  return (
    <div
      className={`${className}${ssrOnly ? " home-lang-ssr-only" : ""}`}
      role="group"
      aria-label={label}
    >
      <LocaleAnchors links={links} current={locale} />
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="home-lang-globe"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="9"
        cy="9"
        r="6.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M2.25 9h13.5M9 2.25c1.8 2.1 1.8 11.4 0 13.5M9 2.25C7.2 4.35 7.2 13.65 9 15.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`home-lang-chevron${open ? " is-open" : ""}`}
      width="12"
      height="12"
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
  dismissSignal = 0,
  ssrOnlyLinks = false,
  menuClassName = "",
}: {
  locale: string;
  label: string;
  links: LocaleMenuLink[];
  rowClassName: string;
  onOpen?: () => void;
  dismissSignal?: number;
  /** Hide segmented links visually but keep anchors in SSR HTML. */
  ssrOnlyLinks?: boolean;
  menuClassName?: string;
}) {
  const pathname = usePathname();
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const current = links.find((item) => item.locale === locale);
  const currentNative =
    current && isHomeLocale(current.locale)
      ? localeNativeName(current.locale)
      : (current?.label ?? locale);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (dismissSignal) setOpen(false);
  }, [dismissSignal]);

  const syncPopoverAnchor = () => {
    if (!buttonRef.current) {
      setPopoverAnchor(null);
      return;
    }
    const next = anchorBelowTriggerRight(
      buttonRef.current,
      LANG_POPOVER_WIDTH,
    );
    setPopoverAnchor({ top: next.top, left: next.left });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPopoverAnchor(null);
      return;
    }
    syncPopoverAnchor();
    window.addEventListener("resize", syncPopoverAnchor);
    window.addEventListener("scroll", syncPopoverAnchor, true);
    return () => {
      window.removeEventListener("resize", syncPopoverAnchor);
      window.removeEventListener("scroll", syncPopoverAnchor, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (isEscapeKey(event.key)) {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      const items = menuRef.current?.querySelectorAll<HTMLAnchorElement>(
        '[role="menuitemradio"]',
      );
      if (!items?.length) return;
      const list = [...items];
      const index = list.indexOf(document.activeElement as HTMLAnchorElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        list[(index + 1 + list.length) % list.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        list[(index - 1 + list.length) % list.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        list[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        list[list.length - 1]?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (
        isOutsideOverlayNodes(
          [buttonRef.current, menuRef.current],
          event.target,
        )
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function openMenu() {
    setOpen(true);
    onOpen?.();
    requestAnimationFrame(() => {
      const currentItem = menuRef.current?.querySelector<HTMLAnchorElement>(
        '[aria-current="true"]',
      );
      currentItem?.focus();
    });
  }

  return (
    <>
      <LocaleLinkGroup
        className={rowClassName}
        label={label}
        locale={locale}
        links={links}
        ssrOnly={ssrOnlyLinks}
      />
      <div
        className={`home-lang-menu${menuClassName ? ` ${menuClassName}` : ""}`}
        ref={rootRef}
        data-open={open ? "true" : "false"}
      >
        <button
          ref={buttonRef}
          type="button"
          className="home-lang-current"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={popoverId}
          aria-label={`${label}: ${currentNative}`}
          onClick={() => {
            if (open) {
              setOpen(false);
              return;
            }
            openMenu();
          }}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowDown" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              if (!open) openMenu();
            }
          }}
        >
          <span className="home-lang-name">{label}</span>
          <GlobeIcon />
          {current?.label}
          <Chevron open={open} />
        </button>
      </div>
      {open && popoverAnchor && typeof document !== "undefined"
        ? createPortal(
            <div
              id={popoverId}
              ref={menuRef}
              className="home-lang-popover home-lang-popover-portal home-header-overlay"
              role="menu"
              aria-label={label}
              style={{
                top: popoverAnchor.top,
                left: popoverAnchor.left,
                width: LANG_POPOVER_WIDTH,
              }}
            >
              <LocaleAnchors links={links} current={locale} menuMode />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
