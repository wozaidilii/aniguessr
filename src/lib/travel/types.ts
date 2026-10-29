import type { NavText } from "~/lib/pilgrimage-nav";

export type TravelMode = "transit" | "walking" | "driving";
export type TravelInterest = "sightseeing" | "food" | "onsen";
export type TravelPace = "relaxed" | "balanced" | "full";
export interface Coordinate {
  lat: number;
  lng: number;
}
export interface TravelPlace extends Coordinate {
  id: string;
  name: NavText;
  kind: TravelInterest | "hub";
  minutes: number;
  description: NavText;
  sourceUrl: string;
  klookRegion: string;
}
export interface TripState {
  version: 1;
  mode: "anime" | "route";
  animeIds: string[];
  spotIds: string[];
  placeIds: string[];
  /** Namespaced IDs: hub:tokyo, place:nishiki, spot:anitabi_... */
  routeIds: string[];
  excludedIds: string[];
  stopOrder: string[];
  /** Optional day boundaries, keyed by stop ID; transfers still count on the new day. */
  dayBreakBefore: string[];
  days: number;
  pace: TravelPace;
  transport: TravelMode;
  interests: TravelInterest[];
  startDate: string;
  radiusKm: number;
  visitMinutes: Record<string, number>;
}
export interface TripStop extends Coordinate {
  id: string;
  name: NavText;
  kind: "anime" | TravelInterest | "hub";
  minutes: number;
  spotId?: string;
  subjectId?: string;
  sourceUrl?: string;
  description?: NavText;
  klookRegion?: string;
}
export interface ScheduledStop {
  stop: TripStop;
  arrivalMinutes: number;
  departureMinutes: number;
  travelMinutes: number;
  distanceKm: number;
  from?: TripStop;
}
export interface TripDay {
  day: number;
  stops: ScheduledStop[];
  minutes: number;
  distanceKm: number;
  overBudget: boolean;
}
export interface RouteCandidate {
  stop: TripStop;
  distanceKm: number;
  progressKm: number;
}
export interface TripPlan {
  ordered: TripStop[];
  days: TripDay[];
  unscheduled: TripStop[];
  discoveries: RouteCandidate[];
  nearby: RouteCandidate[];
  unknownIds: string[];
  omittedAnimeSpots: number;
  longTransfers: number;
}
export interface KlookLink {
  href: string;
  sponsored: boolean;
}
export type KlookLinks = Record<string, KlookLink>;
