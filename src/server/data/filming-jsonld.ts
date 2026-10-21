import {
  pickLocalizedText,
  pickMaybeLocalizedText,
} from "~/lib/localized-text";
import { spotPlaceName } from "~/lib/spot-name-overrides";
import {
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { absoluteUrl } from "~/lib/seo";
import { type FilmingLocationInput } from "~/lib/structured-data";
import type { PilgrimageSpot } from "~/server/data/pilgrimage-seo";

export function toFilmingLocation(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
  fallbackDescription = "",
): FilmingLocationInput {
  const description =
    pickLocalizedText(spot.description, locale) || fallbackDescription;
  // Spot screenshots stay on the page. They are not a TouristAttraction image.
  return {
    name: spotPlaceName(spot, locale),
    description,
    url: absoluteUrl(
      withPilgrimageLocale(
        `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
        locale,
      ),
    ),
    latitude: spot.lat,
    longitude: spot.lng,
    area: pickLocalizedText(spot.location, locale),
    anime: pickLocalizedText(spot.animeTitle, locale),
    episode: pickMaybeLocalizedText(spot.episodeContext, locale),
  };
}
