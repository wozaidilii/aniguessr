import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNotFound } from "~/components/site/site-not-found";
import { isHomeLocale } from "~/lib/home-locale";
import { notFoundCopy } from "~/lib/not-found-copy";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isHomeLocale(locale)) return {};
  return {
    title: notFoundCopy(locale).title,
    robots: { index: false, follow: false },
  };
}

/** Static document the 404 shell serves. It is not linked and is noindex. */
export default async function StyledNotFoundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isHomeLocale(locale)) notFound();
  return <SiteNotFound />;
}
