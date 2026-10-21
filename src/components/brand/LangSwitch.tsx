"use client";

import { HOME_LANG_LINKS } from "~/lib/home-page-copy";
import type { HomeLocale } from "~/lib/home-locale";

export function LangSwitch({
  locale,
  onSelect,
}: {
  locale: HomeLocale;
  onSelect: (locale: HomeLocale) => void;
}) {
  return (
    <div className="ag-lang" role="group" aria-label="Language">
      {HOME_LANG_LINKS.map((item) => (
        <button
          key={item.locale}
          type="button"
          aria-pressed={locale === item.locale}
          onClick={() => onSelect(item.locale)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
