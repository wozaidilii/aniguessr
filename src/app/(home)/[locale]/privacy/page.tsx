import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrivacyMarkdown } from "~/components/privacy/PrivacyMarkdown";
import { isHomeLocale, type HomeLocale } from "~/lib/home-locale";
import { privacyMarkdown, privacyPageMetadata } from "~/lib/privacy-policy";
import { siteNavModel } from "~/lib/site-nav";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isHomeLocale(locale)) return {};
  return privacyPageMetadata(locale);
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isHomeLocale(localeParam)) notFound();
  const locale: HomeLocale = localeParam;
  const nav = siteNavModel(`/${locale}/privacy`, locale);
  const htmlLang = locale === "zh-tw" ? "zh-Hant" : locale;

  return (
    <main className="home privacy-page" lang={htmlLang}>
      <header className="privacy-bar">
        <a className="privacy-brand" href={nav.home}>
          ANIGUESSR
        </a>
        <nav className="privacy-langs" aria-label="Language">
          {nav.languages.map((item) => (
            <a
              key={item.locale}
              href={item.href}
              hrefLang={item.locale === "zh-tw" ? "zh-Hant" : item.locale}
              aria-current={item.locale === locale ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <article>
        <PrivacyMarkdown source={privacyMarkdown(locale)} />
      </article>
    </main>
  );
}
