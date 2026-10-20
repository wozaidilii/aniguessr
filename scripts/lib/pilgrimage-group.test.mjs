import { describe, expect, it } from "vitest";
import {
  chooseCanonicalSubject,
  clusterWithinMeters,
  groupSubjects,
  stripSeasonKey,
} from "./pilgrimage-group.mjs";

function subject(subjectId, ja, en, zh, year, spotCount) {
  return {
    subjectId,
    titles: { ja, en, zh },
    year,
    spotCount,
  };
}

describe("season grouping", () => {
  it("merges Seishun Buta Yarou onto the Bunny Girl Senpai TV subject", () => {
    const members = [
      subject(
        "467930",
        "青春ブタ野郎はサンタクロースの夢を見ない",
        "Rascal Does Not Dream of Santa Claus",
        "青春笨蛋少年不做圣诞老人的梦",
        2025,
        214,
      ),
      subject(
        "240038",
        "青春ブタ野郎はバニーガール先輩の夢を見ない",
        "Rascal Does Not Dream of Bunny Girl Senpai",
        "青春笨蛋少年不做兔女郎学姐的梦",
        2018,
        126,
      ),
      subject(
        "260680",
        "青春ブタ野郎はゆめみる少女の夢を見ない",
        "Rascal Does Not Dream of a Dreaming Girl",
        "青春笨蛋少年不做梦的少女的梦",
        2019,
        76,
      ),
      subject(
        "402656",
        "青春ブタ野郎はおでかけシスターの夢を見ない",
        "Rascal Does Not Dream of a Sister Venturing Out",
        "青春笨蛋少年不做外出姐姐的梦",
        2023,
        41,
      ),
      subject(
        "426239",
        "青春ブタ野郎はランドセルガールの夢を見ない",
        "Rascal Does Not Dream of a Dreaming Girl",
        "青春笨蛋少年不做书包女孩的梦",
        2023,
        11,
      ),
    ];
    const groups = groupSubjects(members);
    expect(groups).toHaveLength(1);
    expect(chooseCanonicalSubject(groups[0]).subjectId).toBe("240038");
  });

  it("strips final-chapter markers so a movie series shares one key", () => {
    const tv = stripSeasonKey("ガールズ&パンツァー");
    const movie = stripSeasonKey("ガールズ&パンツァー 劇場版");
    const finale = stripSeasonKey("ガールズ＆パンツァー 最終章 第1話");
    expect(movie).toBe(tv);
    expect(finale).toBe(tv);
  });

  it("clusters same-anime spots within 10 meters", () => {
    const spots = [
      { id: "a", lat: 35.3, lng: 139.48, confidence: "low", imagePath: null },
      {
        id: "b",
        lat: 35.30005,
        lng: 139.48,
        confidence: "high",
        imagePath: null,
      },
      { id: "c", lat: 36.1, lng: 140.1, confidence: "high", imagePath: null },
    ];
    const groups = clusterWithinMeters(spots, 10);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((spot) => spot.id).sort()).toEqual(["a", "b"]);
  });
});
