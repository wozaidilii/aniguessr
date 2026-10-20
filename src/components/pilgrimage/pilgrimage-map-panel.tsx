import Link from "next/link";
import { AnitabiCredit } from "~/components/pilgrimage/anitabi-credit";
import { PilgrimageMapLoader } from "~/components/pilgrimage/pilgrimage-map-loader";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { type PilgrimageLocale, withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export function PilgrimageMapPanel({
  locale,
  subjectId,
  locationSlug,
  sourceUrl,
}: {
  locale: PilgrimageLocale;
  subjectId?: string;
  locationSlug?: string;
  sourceUrl?: string | null;
}) {
  const copy = getPilgrimageCopy(locale);
  return (
    <section className="mb-10" id="pilgrimage-map">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-black text-white">{copy.mapTitle}</h2>
        <Link
          href={withPilgrimageLocale("/pilgrimage#favorites", locale)}
          className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
        >
          {copy.editFavorites}
        </Link>
      </div>
      <div className="anime-panel h-[min(70vh,560px)] min-h-[320px] overflow-hidden">
        <PilgrimageMapLoader
          locale={locale}
          subjectId={subjectId}
          locationSlug={locationSlug}
        />
      </div>
      <AnitabiCredit locale={locale} sourceUrl={sourceUrl} className="mt-2" />
    </section>
  );
}
