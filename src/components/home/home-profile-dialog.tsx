"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { homeProfileUiLocale } from "~/lib/home-profile-ui-locale";
import type { HomePageCopy } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";
import { buildProfileRegionOptions } from "~/lib/profile-region-options";
import { isEscapeKey, isPointerOutsideRoot } from "~/lib/menu-dismiss";

export function HomeProfileDialog({
  open,
  locale,
  copy,
  name,
  country,
  saving,
  onNameChange,
  onCountryChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  locale: HomeLocale;
  copy: HomePageCopy;
  name: string;
  country: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initial = useRef({ name, country });
  const uiLocale = homeProfileUiLocale(locale);
  const regionOptions = useMemo(
    () => buildProfileRegionOptions(uiLocale, copy.countryUnset),
    [uiLocale, copy.countryUnset],
  );
  const unchanged =
    name.trim() === initial.current.name.trim() &&
    country === initial.current.country;
  const canSave = name.trim().length > 0 && !unchanged && !saving;

  useEffect(() => {
    if (!open) return;
    initial.current = { name, country };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (!isEscapeKey(event.key)) return;
      event.preventDefault();
      onCancel();
    }
    function onPointer(event: PointerEvent) {
      if (!isPointerOutsideRoot(panelRef.current, event.target)) return;
      if (
        event.target instanceof Element &&
        event.target.classList.contains("home-profile-scrim")
      ) {
        onCancel();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onCancel, name, country]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="home-profile-layer" role="presentation">
      <div className="home-profile-scrim" aria-hidden="true" />
      <div
        ref={panelRef}
        className="home-profile-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-profile-grab" aria-hidden="true" />
        <h2 id={titleId}>{copy.profileTitle}</h2>
        <label className="home-profile-field">
          <span>{copy.username}</span>
          <input
            ref={inputRef}
            type="text"
            maxLength={12}
            autoComplete="nickname"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
          <span className="home-profile-count" aria-live="polite">
            {name.length}/12
          </span>
        </label>
        <label className="home-profile-field">
          <span>{copy.country}</span>
          <select
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
          >
            {regionOptions.map((option) => (
              <option key={option.value || "unset"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="home-profile-actions">
          <button
            type="button"
            className="home-btn home-btn-secondary home-profile-cancel"
            onClick={onCancel}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="home-btn home-btn-primary home-profile-save"
            disabled={!canSave}
            onClick={onSave}
          >
            {saving ? copy.saving : copy.saveProfile}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
