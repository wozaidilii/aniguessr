"use client";

import { usePathname } from "next/navigation";
import { HomeHeader } from "~/components/home/home-header";
import { PersistentHomeMap } from "~/components/home/persistent-home-map";
import type { HomeLocale } from "~/lib/home-locale";

export function SiteShell({
  locale,
  children,
}: {
  locale: HomeLocale;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || `/${locale}`;
  const hideHeader = pathname.includes("/privacy");
  return (
    <>
      {hideHeader ? null : <HomeHeader locale={locale} />}
      <div key={pathname} className="site-content">
        {children}
      </div>
      <PersistentHomeMap locale={locale} />
    </>
  );
}
