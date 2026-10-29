import Link from "next/link";
import {
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { getTravelCopy } from "~/lib/travel/copy";

export function PlannerLink({
  locale,
  animeId,
  spotId,
  area,
}: {
  locale: PilgrimageLocale;
  animeId?: string;
  spotId?: string;
  area?: string;
}) {
  const query = new URLSearchParams();
  if (animeId) query.set("anime", animeId);
  if (spotId) query.set("spot", spotId);
  if (area) query.set("area", area);
  return (
    <Link
      className="mb-5 block w-fit rounded-xl border border-[#d7dfcc] bg-[#f2f6ed] px-5 py-3 text-sm font-bold text-[#4d653d] hover:bg-[#e6efdf]"
      href={withPilgrimageLocale(
        `/pilgrimage/planner?${query.toString()}`,
        locale,
      )}
    >
      {getTravelCopy(locale).nav} ↗
    </Link>
  );
}
