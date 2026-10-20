import { describe, expect, it } from "vitest";
import { withAnimeLocale } from "~/lib/anime-locale";
import { pilgrimageRedirectPath } from "~/lib/pilgrimage-redirects";

const map = {
  animeBySubjectId: {
    "240038": "240038-青春笨蛋少年不做兔女郎学姐的梦",
    "467930": "240038-青春笨蛋少年不做兔女郎学姐的梦",
  },
  locations: {
    镰仓市: "kamakura-kanagawa",
  },
  spots: {
    anitabi_old: "anitabi_new",
  },
};

describe("pilgrimage redirect paths", () => {
  it("301 target for a season subject id is the canonical anime slug", () => {
    expect(
      pilgrimageRedirectPath("/ja/pilgrimage/anime/467930-santa", "ja", map),
    ).toBe(
      withAnimeLocale(
        "/pilgrimage/anime/240038-青春笨蛋少年不做兔女郎学姐的梦",
        "ja",
      ),
    );
    expect(
      pilgrimageRedirectPath(
        "/en/pilgrimage/anime/240038-青春笨蛋少年不做兔女郎学姐的梦",
        "en",
        map,
      ),
    ).toBeNull();
  });

  it("redirects legacy location labels and duplicate spots", () => {
    expect(
      pilgrimageRedirectPath("/zh/pilgrimage/locations/镰仓市", "zh", map),
    ).toBe("/zh/pilgrimage/locations/kamakura-kanagawa");
    expect(
      pilgrimageRedirectPath("/en/pilgrimage/spots/anitabi_old", "en", map),
    ).toBe("/en/pilgrimage/spots/anitabi_new");
    expect(
      pilgrimageRedirectPath("/en/pilgrimage/spots/anitabi_new", "en", map),
    ).toBeNull();
  });
});
