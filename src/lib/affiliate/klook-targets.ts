import targets from "../../../data/affiliate-klook-targets.json";

export interface KlookTargetsFile {
  activitySets: Record<
    string,
    { primary: string; alternates?: string[] }
  >;
  spots: Record<string, string>;
  locations: Record<
    string,
    { tour?: string; destination?: string }
  >;
  destinations: Record<string, string>;
}

const data = targets as KlookTargetsFile;

export function resolveKlookContentPath(input: {
  spotId?: string;
  locationSlug?: string;
}): string | null {
  if (input.spotId) {
    const spotPath = data.spots[input.spotId];
    if (spotPath) return spotPath;
  }

  const locationSlug = input.locationSlug?.trim();
  if (!locationSlug) return null;

  const locationRule = data.locations[locationSlug];
  if (locationRule?.tour) {
    const set = data.activitySets[locationRule.tour];
    if (set?.primary) return set.primary;
  }

  if (locationRule?.destination) {
    const destinationPath = data.destinations[locationRule.destination];
    if (destinationPath) return destinationPath;
  }

  return null;
}

export function getKlookTargetsFile(): KlookTargetsFile {
  return data;
}
