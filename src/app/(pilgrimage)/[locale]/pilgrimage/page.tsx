import { type Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pilgrimageLocale } from "~/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui";
import { homePageMetadata } from "~/lib/home-page-copy";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  return homePageMetadata(locale);
}

export default async function PilgrimageHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = pilgrimageLocale(localeParam);
  permanentRedirect(withPilgrimageLocale("/", locale));
}
