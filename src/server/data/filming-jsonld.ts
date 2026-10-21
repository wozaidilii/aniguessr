import { buildAnimeGuessrImageUrl } from "~/lib/anime-guessr";
import {
  pickLocalizedText,
  pickMaybeLocalizedText,
  pickSpotPlaceFromRecord,
} from "~/lib/localized-text";
import {
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { absoluteUrl } from "~/lib/seo";
import { type FilmingLocationInput } from "~/lib/structured-data";
import { type PilgrimageSpot } from "~/server/data/pilgrimage-seo";

export function toFilmingLocation(
  spot: PilgrimageSpot,
  locale: PilgrimageLocale,
  fallbackDescription = "",
): FilmingLocationInput {
  const image = buildAnimeGuessrImageUrl(spot.imagePath ?? undefined);
  const description =
    pickLocalizedText(spot.description, locale) || fallbackDescription;
  return {
    name: pickSpotPlaceFromRecord(spot.answerName, spot.title, locale),
    description,
    url: absoluteUrl(
      withPilgrimageLocale(
        `/pilgrimage/spots/${encodeSpotId(spot.id)}`,
        locale,
      ),
    ),
    image: image
      ? /^https?:\/\//i.test(image)
        ? image
        : absoluteUrl(image)
      : null,
    latitude: spot.lat,
    longitude: spot.lng,
    area: pickLocalizedText(spot.location, locale),
    anime: pickLocalizedText(spot.animeTitle, locale),
    episode: pickMaybeLocalizedText(spot.episodeContext, locale),
  };
}
