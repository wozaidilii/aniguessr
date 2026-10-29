import { localizedNavText, type NavCatalog } from "~/lib/pilgrimage-nav";
import type { PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { getGuideCopy } from "./guide-copy";
import { guideTitle, recommendGuides } from "./guides";
import { tripStopName } from "./labels";
import type { TripPlan, TripState } from "./types";

export const JAPAN_TRAVEL_FORUM =
  "https://www.japan-guide.com/forum/quedisplay.html";

export function exportGuideText(
  plan: TripPlan,
  state: TripState,
  locale: PilgrimageLocale,
): string {
  const guides = recommendGuides(plan, state, locale);
  if (!guides.length) return "";
  const copy = getGuideCopy(locale);
  return [
    `## ${copy.title}`,
    copy.caveat,
    "",
    ...guides.flatMap(({ guide }) => [
      `${guideTitle(guide, locale)} — ${guide.publisher}`,
      `${copy.language}: ${guide.language === "en" ? copy.english : copy.traditional} · ${copy.checked}: ${guide.checkedAt}`,
      guide.url,
      "",
    ]),
  ].join("\n");
}

/** User-reviewed community handoff. Deliberately omit exact dates, coordinates and promotional links. */
export function buildCommunityQuestion(
  plan: TripPlan,
  state: TripState,
  catalog: NavCatalog,
): string {
  const animeIds = [
    ...new Set([
      ...state.animeIds,
      ...plan.ordered.flatMap((stop) =>
        stop.subjectId ? [stop.subjectId] : [],
      ),
    ]),
  ];
  const names = animeIds.flatMap((id) =>
    catalog.animes[id] ? [localizedNavText(catalog.animes[id], "en")] : [],
  );
  const modes = {
    transit: "public transport",
    walking: "walking",
    driving: "driving",
  };
  return [
    `Japan itinerary feedback: ${state.days} days, ${modes[state.transport]}`,
    "",
    "Hello! I am planning the following trip and would appreciate advice on feasibility and local experiences.",
    `Travel style: ${state.pace}; getting around by ${modes[state.transport]}.`,
    ...(names.length ? [`Anime interests: ${names.join(", ")}.`] : []),
    `Other interests: ${state.interests.join(", ") || "not specified"}.`,
    "",
    ...plan.days.map(
      (day) =>
        `Day ${day.day}: ${day.stops.map(({ stop }) => tripStopName(stop, "en")).join(" → ") || "Unplanned / rest"}${day.overBudget ? " [currently over the estimated daily budget]" : ""}`,
    ),
    ...(plan.unscheduled.length
      ? [
          "",
          `Not yet fitted into the schedule: ${plan.unscheduled.map((stop) => tripStopName(stop, "en")).join(", ")}.`,
        ]
      : []),
    "",
    "Questions:",
    "1. Are these travel legs and daily groupings realistic? What should I drop or rearrange?",
    "2. Which local food, cultural sights or baths fit the route without a large detour?",
    "3. Are there access restrictions, reservation requirements or transport changes I should check?",
    "",
    "These are approximate planning estimates; I have not confirmed live transport schedules or opening hours.",
    "Before posting, I will add any useful seasonal context, budget, mobility needs or specific questions I am comfortable sharing.",
  ].join("\n");
}
