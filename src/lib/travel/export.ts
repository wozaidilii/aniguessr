import { tripStopName } from "~/lib/travel/labels";
import { localizedNavText, type NavCatalog } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { dayLabel, getTravelCopy } from "./copy";
import { legDirectionsUrl } from "./engine";
import { tripDate } from "./state";
import type { TripPlan, TripState } from "./types";

export function formatTripTime(minutes: number): string {
  const day = Math.floor(minutes / 1440);
  const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return day ? `${time} (+${day}d)` : time;
}

export function exportTripText(
  plan: TripPlan,
  state: TripState,
  catalog: NavCatalog,
  locale: PilgrimageLocale,
): string {
  const copy = getTravelCopy(locale);
  const lines = [
    `# AniGuessr · ${copy.itinerary}`,
    "",
    `${state.days} ${copy.dayUnit} · ${copy[state.transport]} · ${copy[state.pace]}`,
    "",
    copy.disclaimer,
    "",
  ];
  for (const day of plan.days) {
    lines.push(
      `## ${dayLabel(locale, day.day)} ${tripDate(state.startDate, day.day, locale)}`,
      copy.rest,
    );
    if (day.overBudget) lines.push(copy.overBudget);
    if (!day.stops.length) lines.push(copy.freeDay);
    for (const visit of day.stops) {
      const stop = visit.stop;
      const title = stop.subjectId ? catalog.animes[stop.subjectId] : undefined;
      lines.push(
        `${formatTripTime(visit.arrivalMinutes)}–${formatTripTime(visit.departureMinutes)} ${tripStopName(stop, locale)}${title ? ` · ${localizedNavText(title, locale)}` : ""}`,
        `${copy.estimated}: ${visit.travelMinutes} ${copy.min} / ~${visit.distanceKm.toFixed(1)} km`,
        legDirectionsUrl(visit.from, stop, state.transport),
      );
      if (stop.sourceUrl) lines.push(stop.sourceUrl);
    }
    lines.push("");
  }
  if (plan.unscheduled.length)
    lines.push(
      `## ${copy.overflow}`,
      copy.overflowHelp,
      ...plan.unscheduled.map((stop) => `- ${tripStopName(stop, locale)}`),
    );
  return lines.join("\n");
}
