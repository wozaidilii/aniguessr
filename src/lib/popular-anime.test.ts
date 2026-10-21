import { describe, expect, it } from "vitest";
import {
  POPULAR_ANIME_SUBJECT_IDS,
  resolvePopularAnime,
  type PopularAnimeSource,
} from "~/lib/popular-anime";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

const buta: PopularAnimeSource = {
  subjectId: "240038",
  subjectIds: ["240038", "999001"],
  slug: "240038-青春ブタ野郎",
  animeTitle: {
    zh: "青春猪头少年不会梦到兔女郎学姐",
    ja: "青春ブタ野郎はバニーガール先輩の夢を見ない",
    en: "Rascal Does Not Dream of Bunny Girl Senpai",
    tw: "青春豬頭少年不會夢到兔女郎學姊",
  },
  spotCount: 392,
};

const jujutsu: PopularAnimeSource = {
  subjectId: "294993",
  slug: "294993-咒术回战",
  animeTitle: {
    zh: "咒术回战",
    ja: "呪術廻戦",
    en: "Jujutsu Kaisen",
    tw: "咒術迴戰",
  },
  spotCount: 133,
};

describe("popular anime chips", () => {
  it("keeps the curated order and resolves merged subject ids", () => {
    const merged = {
      ...buta,
      subjectId: "canon-buta",
      subjectIds: ["canon-buta", "240038"],
      slug: "canon-buta",
      spotCount: 400,
    };
    const chips = resolvePopularAnime([merged, jujutsu], "ja");
    expect(chips.map((chip) => chip.subjectId)).toEqual([
      "294993",
      "canon-buta",
    ]);
    expect(chips[0]).toMatchObject({
      title: "呪術廻戦",
      spotCount: 133,
      href: withPilgrimageLocale("/pilgrimage/anime/294993-咒术回战", "ja"),
    });
    expect(chips[1]).toMatchObject({
      title: "青春ブタ野郎はバニーガール先輩の夢を見ない",
      spotCount: 400,
      href: "/ja/pilgrimage/anime/canon-buta",
    });
    expect(POPULAR_ANIME_SUBJECT_IDS).not.toContain("899");
  });

  it("skips ids that are not in the index and uses the locale title", () => {
    const chips = resolvePopularAnime([jujutsu], "en");
    expect(chips).toEqual([
      {
        subjectId: "294993",
        slug: "294993-咒术回战",
        href: withPilgrimageLocale("/pilgrimage/anime/294993-咒术回战", "en"),
        title: "Jujutsu Kaisen",
        spotCount: 133,
      },
    ]);
    expect(resolvePopularAnime([jujutsu], "zh-tw")[0]?.title).toBe("咒術迴戰");
  });
});
