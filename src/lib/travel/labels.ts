import { localizedNavText, localizedSpotName } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import type { TripStop } from "./types";

/** Match the spot detail page's curated display-name overrides in every view/export. */
export function tripStopName(stop: TripStop, locale: PilgrimageLocale): string {
  return stop.spotId
    ? localizedSpotName({ id: stop.spotId, name: stop.name }, locale)
    : localizedNavText(stop.name, locale);
}
