import Link from "next/link";
import { notFound } from "next/navigation";
import { AnitabiAttribution } from "~/components/anitabi-attribution";
import { PilgrimageFavoritesProvider } from "~/components/pilgrimage/favorites";
import { withAnimeLocale } from "~/lib/anime-locale";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  isPilgrimageLocale,
  pilgrimageSiteLocale,
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";

export function pilgrimageLocale(value: string): PilgrimageLocale {
  if (!isPilgrimageLocale(value)) notFound();
  return value;
}

export function pilgrimageHref(path: string, locale: PilgrimageLocale): string {
  return withPilgrimageLocale(path, locale);
}

/** Home and the game stay on zh/ja/en. /zh-tw does not have those routes. */
export function pilgrimageSiteHref(
  path: string,
  locale: PilgrimageLocale,
): string {
  return withAnimeLocale(path, pilgrimageSiteLocale(locale));
}

export function PilgrimageShell({
  locale,
  kicker,
  title,
  description,
  children,
}: {
  locale: PilgrimageLocale;
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="anime-shell min-h-screen text-white" data-locale={locale}>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="mb-8 max-w-3xl">
          <div className="anime-chip mb-4 w-fit">{kicker}</div>
          <h1 className="text-3xl leading-tight font-black text-white sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base leading-7 text-pink-50/75 sm:text-lg">
              {description}
            </p>
          ) : null}
        </header>

        <PilgrimageFavoritesProvider>{children}</PilgrimageFavoritesProvider>
        <AnitabiAttribution locale={locale} className="mt-10 text-center" />
        <p className="mt-1.5 text-center text-xs text-white/45">© 2026 Ayiora</p>
      </div>
    </main>
  );
}

export function PilgrimageCardGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

export function PilgrimageCard({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="anime-panel block p-4 transition hover:border-pink-200/40 hover:bg-white/10"
    >
      <h2 className="text-base font-black text-white">{title}</h2>
      <p className="mt-2 text-sm text-pink-100/65">{meta}</p>
    </Link>
  );
}

export function PilgrimageSpotList({
  locale,
  spots,
}: {
  locale: PilgrimageLocale;
  spots: Array<{
    id: string;
    href: string;
    title: string;
    subtitle: string;
  }>;
}) {
  const copy = getPilgrimageCopy(locale);
  if (spots.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-pink-100/60">
        {copy.emptyIndex}
      </p>
    );
  }

  return (
    <ol className="grid gap-2">
      {spots.map((spot) => (
        <li key={spot.id}>
          <Link
            href={spot.href}
            className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-cyan-200/30 hover:bg-white/10"
          >
            <span className="block font-bold text-white">{spot.title}</span>
            <span className="mt-1 block text-sm text-pink-100/65">
              {spot.subtitle}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
