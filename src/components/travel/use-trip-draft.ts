"use client";

import { useEffect, useRef, useState } from "react";
import type { NavCatalog } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { getTravelCopy } from "~/lib/travel/copy";
import { resolveTripEntry } from "~/lib/travel/entry";
import {
  emptyTrip,
  tripStateSchema,
  TRIP_STORAGE_KEY,
} from "~/lib/travel/state";
import type { TripState } from "~/lib/travel/types";

export function useTripDraft(
  catalog: NavCatalog | null,
  locale: PilgrimageLocale,
  setStatus: (message: string) => void,
) {
  const copy = getTravelCopy(locale);
  const [state, setState] = useState<TripState>(emptyTrip);
  const [initialized, setInitialized] = useState(false);
  const [savedDraft, setSavedDraft] = useState<TripState | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const current = useRef(state);
  const initializedRef = useRef(false);
  const canPersist = useRef(false);
  const history = useRef<TripState[]>([]);

  useEffect(() => {
    if (!catalog || initializedRef.current) return;
    initializedRef.current = true;
    let raw: string | null = null;
    let storageFailed = false;
    try {
      raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
    } catch {
      storageFailed = true;
    }
    const entry = resolveTripEntry(
      catalog,
      window.location.search,
      window.location.hash,
      raw,
    );
    current.current = entry.state;
    setState(entry.state);
    canPersist.current = entry.persist && !storageFailed;
    setSavedDraft(entry.persist ? null : entry.saved);
    setStatus(
      storageFailed
        ? copy.storageError
        : entry.notice
          ? copy[entry.notice]
          : "",
    );
    setInitialized(true);
  }, [catalog, copy, setStatus]);

  // Subscription must survive StrictMode cleanup and locale changes independently of hydration.
  useEffect(() => {
    if (!catalog) return;
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#trip=") && (hash !== "" || canPersist.current))
        return;
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(TRIP_STORAGE_KEY);
      } catch {
        /* Preview still works. */
      }
      const entry = resolveTripEntry(
        catalog,
        window.location.search,
        hash,
        raw,
      );
      current.current = entry.state;
      setState(entry.state);
      canPersist.current = entry.persist;
      setSavedDraft(entry.persist ? null : entry.saved);
      history.current = [];
      setCanUndo(false);
      setStatus(entry.notice ? copy[entry.notice] : "");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [catalog, copy, setStatus]);

  useEffect(() => {
    if (!initialized || !canPersist.current) return;
    try {
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStatus(copy.storageError);
    }
  }, [state, initialized, copy, setStatus]);

  function clearEntryUrl() {
    if (window.location.hash.startsWith("#trip=") || window.location.search) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
      window.dispatchEvent(new Event("hashchange"));
    }
  }
  function apply(next: TripState) {
    current.current = next;
    canPersist.current = true;
    setState(next);
    setSavedDraft(null);
    clearEntryUrl();
  }
  function update(next: TripState): boolean {
    if (!initialized) return false;
    const checked = tripStateSchema.safeParse(next);
    if (!checked.success) {
      setStatus(copy.limit);
      return false;
    }
    history.current = [...history.current, current.current].slice(-20);
    setCanUndo(true);
    apply(checked.data);
    setStatus("");
    return true;
  }
  function undo() {
    const previous = history.current.pop();
    if (!previous) return;
    apply(previous);
    setCanUndo(history.current.length > 0);
    setStatus(copy.undone);
  }
  function restore() {
    if (savedDraft && update(savedDraft)) setStatus(copy.restored);
  }
  function save() {
    try {
      window.localStorage.setItem(
        TRIP_STORAGE_KEY,
        JSON.stringify(current.current),
      );
      canPersist.current = true;
      setSavedDraft(null);
      clearEntryUrl();
      setStatus(copy.saved);
    } catch {
      setStatus(copy.storageError);
    }
  }
  return {
    state,
    initialized,
    update,
    save,
    restore,
    undo,
    canUndo,
    hasSavedDraft: !!savedDraft,
  };
}
