import { type AnimeLocale, withAnimeLocale } from "~/lib/anime-locale";
import { buildAnimeGuessrImageUrl } from "~/lib/anime-guessr";
import { encodeSpotId } from "~/lib/pilgrimage-slug";
import { absoluteUrl } from "~/lib/seo";
import { type FilmingLocationInput } from "~/lib/structured-data";
import {
  pickLocalizedText,
  type PilgrimageSpot,
} from "~/server/data/pilgrimage-seo";

export function toFilmingLocation(
  spot: PilgrimageSpot,
  locale: AnimeLocale,
  fallbackDescription = "",
): FilmingLocationInput {
  const image = buildAnimeGuessrImageUrl(spot.imagePath ?? undefined);
  const description =
    pickLocalizedText(spot.description, locale) || fallbackDescription;
  return {
    name: pickLocalizedText(spot.answerName, locale),
    description,
    url: absoluteUrl(
      withAnimeLocale(`/pilgrimage/spots/${encodeSpotId(spot.id)}`, locale),
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
    episode: spot.episodeContext,
  };
}
