import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  PilgrimageShell,
  pilgrimageLocale,
} from "~/app/[locale]/pilgrimage/_components/pilgrimage-ui";

export default async function AnimeIndexLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = pilgrimageLocale((await params).locale);
  const copy = getPilgrimageCopy(locale);
  return (
    <PilgrimageShell
      locale={locale}
      kicker={copy.siteKicker}
      title={copy.animeArchive}
      description={copy.hubDescription}
    >
      {children}
    </PilgrimageShell>
  );
}
