import targets from "../../../data/affiliate-rakuten-targets.json";

interface RakutenTargetsFile {
  locations: Record<string, string>;
}

const data = targets as RakutenTargetsFile;

function buildRakutenSearchUrl(input: {
  areaLabel: string;
  lat?: number;
  lng?: number;
}) {
  const area = input.areaLabel.trim();
  const destination = new URL("https://travel.rakuten.co.jp/HOTEL/search/");
  if (area) destination.searchParams.set("f_daihyo", area);
  destination.searchParams.set("f_target", "1");
  if (input.lat !== undefined && input.lng !== undefined) {
    destination.searchParams.set("f_lat", String(input.lat));
    destination.searchParams.set("f_lng", String(input.lng));
  }
  return destination.toString();
}

export function resolveRakutenTravelDestination(input: {
  areaLabel: string;
  lat?: number;
  lng?: number;
  locationSlug?: string;
}): string {
  const locationSlug = input.locationSlug?.trim();
  if (locationSlug && data.locations[locationSlug]) {
    return data.locations[locationSlug];
  }
  return buildRakutenSearchUrl(input);
}

export function getRakutenTargetsFile(): RakutenTargetsFile {
  return data;
}
