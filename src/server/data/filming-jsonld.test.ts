import { describe, expect, it } from "vitest";
import { buildTouristAttractionJsonLd } from "~/lib/structured-data";
import { toFilmingLocation } from "~/server/data/filming-jsonld";

const takeshita = {
  id: "anitabi_101399_51i525idi",
  subjectId: "101399",
  subjectSlug: "101399-偶像大师-灰姑娘女孩",
  locationSlug: "shibuya-tokyo",
  lat: 35.671,
  lng: 139.703,
  year: null,
  difficulty: null,
  confidence: "high",
  imagePath: "anime/101399/takeshita.jpg",
  sourceUrl: null,
  title: {
    zh: "竹下口拱门与商店街入口",
    ja: "竹下口アーチと商店街入口",
    en: "Takeshita exit arch",
  },
  description: {
    zh: "场景说明",
    ja: "シーン説明",
    en: "Scene note",
  },
  animeTitle: {
    zh: "偶像大师 灰姑娘女孩",
    ja: "アイドルマスター シンデレラガールズ",
    en: "THE IDOLM@STER CINDERELLA GIRLS",
  },
  location: { zh: "东京都涩谷区", ja: "東京都渋谷区", en: "Shibuya" },
  answerName: {
    zh: "竹下口（原宿）",
    ja: "",
    en: "Takeshita Exit (Harajuku)",
  },
  aspect: null,
  episodeContext: null,
  funfact: [],
};

describe("filming location JSON-LD input", () => {
  it("keeps the screenshot off TouristAttraction image", () => {
    const location = toFilmingLocation(takeshita, "ja");
    expect(location).not.toHaveProperty("image");
    const jsonLd = buildTouristAttractionJsonLd(location);
    expect(jsonLd).not.toHaveProperty("image");
    expect(JSON.stringify(jsonLd)).not.toContain("takeshita.jpg");
    expect(location.name).toBe("竹下通り入口（原宿）");
  });
});
