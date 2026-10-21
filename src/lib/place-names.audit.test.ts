import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getAnimeGuessrQuestionText,
  type AnimeGuessrQuestion,
} from "~/lib/anime-guessr";
import { localizePlaceName, matchPlaceName, type PlaceLocale } from "~/lib/place-names";

const LOCALES = ["ja", "en", "zh", "zh-tw"] as const satisfies readonly PlaceLocale[];

describe("place display audit", () => {
  it("keeps en, zh, and zh-tw on the same place as the Japanese label", () => {
    const bank = JSON.parse(
      readFileSync("public/data/anime-guessr-questions.json", "utf8"),
    ) as { questions: AnimeGuessrQuestion[] };
    const questions = bank.questions;
    const step = Math.max(1, Math.floor(questions.length / 400));
    const sample = questions.filter((_, index) => index % step === 0).slice(0, 400);
    expect(sample.length).toBeGreaterThanOrEqual(200);

    const mismatches: string[] = [];
    for (const question of questions) {
      const point = { lat: question.lat, lng: question.lng };
      const shown = LOCALES.map((locale) =>
        matchPlaceName(question.location, locale, point),
      );
      const kinds = new Set(shown.map((match) => match.kind));
      const jaName = localizePlaceName(question.location, "ja");
      const jaPoint = shown[0]?.label ?? "";
      if (kinds.size !== 1 || jaPoint !== jaName) {
        mismatches.push(
          `${question.id} ${question.location} → ${shown.map((match) => `${match.kind}:${match.label}`).join(" / ")}`,
        );
      }
    }

    expect(mismatches).toEqual([]);

    for (const question of sample) {
      const point = { lat: question.lat, lng: question.lng };
      const expected = localizePlaceName(question.location, "zh-tw", point);
      expect(getAnimeGuessrQuestionText(question, "zh-tw").location).toBe(expected);
      expect(getAnimeGuessrQuestionText(question, "en").location).toBe(
        localizePlaceName(question.location, "en", point),
      );
      expect(getAnimeGuessrQuestionText(question, "ja").location).toBe(
        localizePlaceName(question.location, "ja", point),
      );
    }

    const iwate = questions.find((question) => question.location === "岩手县");
    expect(iwate).toBeTruthy();
    if (iwate) {
      expect(getAnimeGuessrQuestionText(iwate, "zh-tw").location).toBe("岩手縣");
      expect(getAnimeGuessrQuestionText(iwate, "ja").location).toBe("岩手県");
      expect(getAnimeGuessrQuestionText(iwate, "en").location).toBe("Iwate");
    }

    const makuhari = questions.find((question) => question.id === "anitabi_102134_9xs0myq");
    expect(makuhari?.location).toBe("京都市");
    if (makuhari) {
      expect(getAnimeGuessrQuestionText(makuhari, "ja").location).toBe("京都市");
      expect(getAnimeGuessrQuestionText(makuhari, "en").location).toBe("Kyoto");
      expect(localizePlaceName(makuhari.location, "zh")).toBe("京都市");
    }
  });
});
