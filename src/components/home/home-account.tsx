"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { getHomePageCopy } from "~/lib/home-page-copy";
import { homeLoginHref, type HomeLocale } from "~/lib/home-locale";
import { isEscapeKey } from "~/lib/menu-dismiss";
import {
  anchorBelowTriggerRight,
  isOutsideOverlayNodes,
} from "~/lib/overlay-portal";
import {
  clearPlayerSession,
  getStoredPlayerSession,
  savePlayerSession,
} from "~/lib/player-session";
import {
  capturePostHogEvent,
  identifyPostHogUser,
  POSTHOG_EVENTS,
  resetPostHogUser,
} from "~/lib/posthog";
import type { PlayerSession } from "~/types/player";
import { api } from "~/trpc/react";
import { HomeProfileDialog } from "~/components/home/home-profile-dialog";

const DESKTOP_MENU_WIDTH = 272;

function MenuIcon({
  kind,
}: {
  kind: "edit" | "rank" | "logout";
}) {
  const paths = {
    edit: (
      <path
        d="M11.5 3.5 14.5 6.5 6 15H3v-3L11.5 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    rank: (
      <>
        <path
          d="M4 14V9M9 14V6M14 14v-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
    logout: (
      <path
        d="M7 4H4v10h3M10 9h6M13.5 6.5 16 9l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

function AccountMenuPanel({
  id,
  session,
  copy,
  rankHref,
  menuRef,
  mobile,
  style,
  onEditProfile,
  onLogout,
  onNavigate,
}: {
  id: string;
  session: PlayerSession;
  copy: ReturnType<typeof getHomePageCopy>;
  rankHref: string;
  menuRef: React.RefObject<HTMLDivElement | null>;
  mobile: boolean;
  style?: CSSProperties;
  onEditProfile: () => void;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  const user = session.user;
  return (
    <div
      id={id}
      ref={menuRef}
      className={
        mobile ? "home-account-sheet-panel" : "home-account-menu home-header-overlay"
      }
      style={style}
      role="menu"
      aria-label={copy.accountMenu}
    >
      <div className="home-account-head" role="presentation">
        <div className="home-account-head-avatar" aria-hidden="true">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={40}
              height={40}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span style={{ backgroundColor: user.avatar.color }}>
              {user.avatar.icon}
            </span>
          )}
        </div>
        <div className="home-account-head-text">
          <strong>{user.name}</strong>
          {user.email ? <span>{user.email}</span> : null}
        </div>
      </div>
      <hr className="home-menu-divider" />
      <button
        type="button"
        role="menuitem"
        className="home-menu-item"
        onClick={onEditProfile}
      >
        <MenuIcon kind="edit" />
        {copy.editProfile}
      </button>
      <Link
        href={rankHref}
        role="menuitem"
        className="home-menu-item"
        onClick={onNavigate}
      >
        <MenuIcon kind="rank" />
        {copy.navRank}
      </Link>
      <hr className="home-menu-divider" />
      <button
        type="button"
        role="menuitem"
        className="home-menu-item"
        onClick={onLogout}
      >
        <MenuIcon kind="logout" />
        {copy.logout}
      </button>
    </div>
  );
}

export function HomeAccount({
  locale,
  rankHref,
  onOpen,
  dismissSignal = 0,
}: {
  locale: HomeLocale;
  rankHref: string;
  onOpen?: () => void;
  dismissSignal?: number;
}) {
  const copy = getHomePageCopy(locale);
  const pathname = usePathname();
  const loginHref = homeLoginHref(locale, pathname);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = getStoredPlayerSession();
    setSession(stored);
    if (stored) identifyPostHogUser(stored.user);
    setName(stored?.user.name ?? "");
    setCountry(stored?.user.countryCode ?? "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobileSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (dismissSignal) setMenuOpen(false);
  }, [dismissSignal]);

  const syncMenuAnchor = () => {
    if (!buttonRef.current || mobileSheet) {
      setMenuAnchor(null);
      return;
    }
    const next = anchorBelowTriggerRight(
      buttonRef.current,
      DESKTOP_MENU_WIDTH,
    );
    setMenuAnchor({ top: next.top, left: next.left });
  };

  useLayoutEffect(() => {
    if (!menuOpen || mobileSheet) {
      setMenuAnchor(null);
      return;
    }
    syncMenuAnchor();
    window.addEventListener("resize", syncMenuAnchor);
    window.addEventListener("scroll", syncMenuAnchor, true);
    return () => {
      window.removeEventListener("resize", syncMenuAnchor);
      window.removeEventListener("scroll", syncMenuAnchor, true);
    };
  }, [menuOpen, mobileSheet]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = mobileSheet ? document.body.style.overflow : "";
    if (mobileSheet) document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (!isEscapeKey(event.key)) return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      if (
        isOutsideOverlayNodes(
          [buttonRef.current, menuRef.current],
          event.target,
        )
      ) {
        setMenuOpen(false);
        if (mobileSheet) buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      if (mobileSheet) document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen, mobileSheet]);

  const updateProfile = api.player.updateProfile.useMutation({
    onSuccess(user) {
      if (!session) return;
      const next = { token: session.token, user };
      savePlayerSession(next);
      identifyPostHogUser(user);
      setSession(next);
      setName(user.name);
      setCountry(user.countryCode ?? "");
      setProfileOpen(false);
      setToast(copy.saved);
      capturePostHogEvent(POSTHOG_EVENTS.profileUpdated, {}, user.id);
      window.setTimeout(() => setToast(""), 2400);
    },
  });

  function openMenu() {
    setMenuOpen(true);
    onOpen?.();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    clearPlayerSession();
    resetPostHogUser();
    setSession(null);
    closeMenu();
  }

  function openProfileEditor() {
    closeMenu();
    setProfileOpen(true);
  }

  const slot = (
    <div className="home-hdr-account-slot" ref={rootRef}>
      {!hydrated ? (
        <span className="home-hdr-account-placeholder" aria-hidden="true" />
      ) : !session ? (
        <a className="home-login" href={loginHref}>
          {copy.login}
        </a>
      ) : (
        <>
          <button
            ref={buttonRef}
            type="button"
            className="home-avatar-btn"
            aria-haspopup={mobileSheet ? "dialog" : "menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={copy.accountMenu}
            data-open={menuOpen ? "true" : "false"}
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
          >
            {session.user.avatarUrl ? (
              <img
                src={session.user.avatarUrl}
                alt=""
                width={32}
                height={32}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span style={{ backgroundColor: session.user.avatar.color }}>
                {session.user.avatar.icon}
              </span>
            )}
          </button>
          {menuOpen &&
          !mobileSheet &&
          menuAnchor &&
          typeof document !== "undefined"
            ? createPortal(
                <AccountMenuPanel
                  id={menuId}
                  session={session}
                  copy={copy}
                  rankHref={rankHref}
                  menuRef={menuRef}
                  mobile={false}
                  style={{
                    top: menuAnchor.top,
                    left: menuAnchor.left,
                    width: DESKTOP_MENU_WIDTH,
                  }}
                  onEditProfile={openProfileEditor}
                  onLogout={handleLogout}
                  onNavigate={closeMenu}
                />,
                document.body,
              )
            : null}
          {menuOpen && mobileSheet && typeof document !== "undefined"
            ? createPortal(
                <>
                  <div
                    className="home-account-scrim"
                    aria-hidden="true"
                    onClick={() => {
                      closeMenu();
                      buttonRef.current?.focus();
                    }}
                  />
                  <AccountMenuPanel
                    id={menuId}
                    session={session}
                    copy={copy}
                    rankHref={rankHref}
                    menuRef={menuRef}
                    mobile
                    onEditProfile={openProfileEditor}
                    onLogout={handleLogout}
                    onNavigate={closeMenu}
                  />
                </>,
                document.body,
              )
            : null}
        </>
      )}
    </div>
  );

  return (
    <>
      {slot}
      <HomeProfileDialog
        open={profileOpen && Boolean(session)}
        locale={locale}
        copy={copy}
        name={name}
        country={country}
        saving={updateProfile.isPending}
        onNameChange={setName}
        onCountryChange={setCountry}
        onCancel={() => {
          setProfileOpen(false);
          if (session) {
            setName(session.user.name);
            setCountry(session.user.countryCode ?? "");
          }
          buttonRef.current?.focus();
        }}
        onSave={() => {
          if (!session) return;
          updateProfile.mutate({
            token: session.token,
            name,
            avatar: session.user.avatar,
            countryCode: country || null,
          });
        }}
      />
      {toast ? (
        <div className="home-profile-toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  );
}
