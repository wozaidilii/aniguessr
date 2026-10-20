import { describe, expect, it } from "vitest";
import {
  animeSlugMatches,
  parseAnimeSlug,
  parseLocationSlug,
  slugifyAnime,
  slugifyLocation,
} from "~/lib/pilgrimage-slug";

describe("pilgrimage-slug", () => {
  it("slugifyAnime 生成稳定 slug", () => {
    expect(slugifyAnime("51", "CLANNAD")).toBe("51-clannad");
    expect(slugifyAnime("51", "CLANNAD -After Story-")).toBe(
      "51-clannad-after-story",
    );
  });

  it("parseAnimeSlug 解析 subjectId", () => {
    expect(parseAnimeSlug("51-clannad")).toBe("51");
    expect(parseAnimeSlug("anime-999")).toBe("999");
    expect(parseAnimeSlug("invalid")).toBeNull();
  });

  it("treats a percent-encoded CJK slug as the canonical anime slug", () => {
    const canonical = slugifyAnime("328609", "孤独摇滚");
    expect(animeSlugMatches(canonical, canonical)).toBe(true);
    expect(animeSlugMatches(encodeURIComponent(canonical), canonical)).toBe(
      true,
    );
    expect(animeSlugMatches("328609-other", canonical)).toBe(false);
  });

  it("地点 slug 往返", () => {
    const slug = slugifyLocation("东京都");
    expect(parseLocationSlug(slug)).toBe("东京都");
  });
});
