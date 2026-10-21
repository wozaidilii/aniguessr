"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeFooter } from "~/components/home/home-footer";
import { HomeHeader } from "~/components/home/home-header";
import { isHomeLocale, type HomeLocale } from "~/lib/home-locale";
import {
  notFoundCopy,
  notFoundHomeHref,
  notFoundWorksHref,
} from "~/lib/not-found-copy";

function localeFromPath(pathname: string): HomeLocale {
  const first = pathname.split("/")[1] ?? "";
  return isHomeLocale(first) ? first : "ja";
}

export function SiteNotFound({ chrome = false }: { chrome?: boolean }) {
  const pathname = usePathname() || "/ja";
  const locale = localeFromPath(pathname);
  const copy = notFoundCopy(locale);

  return (
    <>
      {chrome ? <HomeHeader locale={locale} /> : null}
      <main className="site-missing">
        <p className="site-missing-code">404</p>
        <h1>{copy.title}</h1>
        <p className="site-missing-body">{copy.body}</p>
        <div className="site-missing-actions">
          <Link href={notFoundHomeHref(locale)} className="anime-button">
            {copy.home}
          </Link>
          <Link
            href={notFoundWorksHref(locale)}
            className="anime-button-secondary"
          >
            {copy.works}
          </Link>
        </div>
      </main>
      <HomeFooter locale={locale} />
    </>
  );
}
