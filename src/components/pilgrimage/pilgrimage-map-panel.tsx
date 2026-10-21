import Link from "next/link";
import { PilgrimageMapLoader } from "~/components/pilgrimage/pilgrimage-map-loader";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import {
  type PilgrimageLocale,
  withPilgrimageLocale,
} from "~/lib/pilgrimage-locale";

export function PilgrimageMapPanel({
  locale,
  subjectId,
  locationSlug,
}: {
  locale: PilgrimageLocale;
  subjectId?: string;
  locationSlug?: string;
}) {
  const copy = getPilgrimageCopy(locale);
  return (
    <section className="mb-10" id="pilgrimage-map">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-black text-white">{copy.mapTitle}</h2>
        <Link
          href={withPilgrimageLocale("/", locale)}
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
    </section>
  );
}
