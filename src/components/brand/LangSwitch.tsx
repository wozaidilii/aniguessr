"use client";

import { LANG_ORDER, LANG_SHORT } from "~/lib/aniguessr-copy";
import type { AnimeLocale } from "~/lib/anime-locale";

export function LangSwitch({
  locale,
  onSelect,
}: {
  locale: AnimeLocale;
  onSelect: (locale: AnimeLocale) => void;
}) {
  return (
    <div className="ag-lang" role="group" aria-label="Language">
      {LANG_ORDER.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={locale === item}
          onClick={() => onSelect(item)}
        >
          {LANG_SHORT[item]}
        </button>
      ))}
    </div>
  );
}
