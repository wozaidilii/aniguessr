import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HomeMapLabels } from "~/lib/home-map-labels";
import {
  aggregateFocusedLabels,
  focusZoom,
  prefectureKey,
  workFocusFrame,
} from "~/lib/home-map-focus";

function label(
  id: string,
  ja: string,
  count: number,
): HomeMapLabels["areas"][number] {
  return {
    id,
    ja,
    zh: ja,
    tw: ja,
    en: ja,
    count,
    lng: 0,
    lat: 0,
    west: 0,
    south: 0,
    east: 0,
    north: 0,
    major: count >= 150,
  };
}

const base: HomeMapLabels = {
  version: 1,
  areas: [
    label("shibuya-tokyo", "渋谷", 900),
    label("shinjuku-tokyo", "新宿", 400),
    label("kamakura-kanagawa", "鎌倉", 200),
    label("naha-okinawa", "那覇", 40),
    label("yamanakako-yamanashi", "山中湖", 80),
    label("minobu-19365", "身延", 30),
  ],
  prefectures: [
    label("tokyo", "東京", 7133),
    label("kanagawa", "神奈川", 1200),
    label("okinawa", "沖縄", 366),
    label("kyoto", "京都", 1687),
    label("yamanashi", "山梨", 400),
  ],
};

describe("focused map aggregation", () => {
  it("counts only the work and hides prefectures with no spots", () => {
    const focused = aggregateFocusedLabels(base, [
      { locationSlug: "shibuya-tokyo", lng: 139.7, lat: 35.66 },
      { locationSlug: "shibuya-tokyo", lng: 139.71, lat: 35.659 },
      { locationSlug: "shinjuku-tokyo", lng: 139.7, lat: 35.69 },
      { locationSlug: "naha-okinawa", lng: 127.68, lat: 26.21 },
      { locationSlug: "minobu-19365", lng: 138.44, lat: 35.36 },
    ]);
    expect(focused.prefectures.map((item) => [item.id, item.ja, item.count])).toEqual([
      ["tokyo", "東京", 3],
      ["okinawa", "沖縄", 1],
      ["yamanashi", "山梨", 1],
    ]);
    expect(focused.prefectures.some((item) => item.id === "kyoto")).toBe(false);
    expect(focused.areas.map((item) => [item.id, item.count])).toEqual([
      ["shibuya-tokyo", 2],
      ["minobu-19365", 1],
      ["naha-okinawa", 1],
      ["shinjuku-tokyo", 1],
    ]);
    expect(focused.areas.some((item) => item.id === "kamakura-kanagawa")).toBe(false);
    expect(focused.prefectures[0]?.major).toBe(false);
  });

  it("reads a prefecture from a slug suffix or a JIS code", () => {
    expect(prefectureKey("shibuya-tokyo")).toBe("tokyo");
    expect(prefectureKey("minobu-19365")).toBe("yamanashi");
    expect(prefectureKey("unknown-place")).toBe("");
  });

  it("fits a Tokyo-heavy work on Tokyo instead of the nationwide outliers", () => {
    const tokyo = Array.from({ length: 120 }, (_, index) => ({
      lng: 139.68 + (index % 10) * 0.008,
      lat: 35.65 + Math.floor(index / 10) * 0.004,
    }));
    const frame = workFocusFrame([
      ...tokyo,
      { lng: 127.68, lat: 26.21 },
      { lng: 140.85, lat: 38.76 },
      { lng: 134.55, lat: 34.07 },
    ]);
    expect(frame).not.toBeNull();
    expect(frame?.spansCountry).toBe(false);
    expect(frame?.west).toBeGreaterThan(139);
    expect(frame?.east).toBeLessThan(141);
    expect(frame?.south).toBeGreaterThan(35);
    expect(frame?.north).toBeLessThan(36.2);
    expect(focusZoom(11.4, frame?.spansCountry ?? true)).toBe(11.4);
  });

  it("keeps a regional work's full bbox and a truly nationwide work at the zoom floor", () => {
    const region = workFocusFrame([
      { lng: 138.2, lat: 35.4 },
      { lng: 138.9, lat: 35.6 },
      { lng: 137.1, lat: 34.7 },
      { lng: 139.1, lat: 35.1 },
    ]);
    expect(region?.spansCountry).toBe(false);
    expect(region?.points).toHaveLength(4);
    expect(focusZoom(8.2, false)).toBe(8.2);

    const spread = [
      ...Array.from({ length: 20 }, () => ({ lng: 141.35, lat: 43.06 })),
      ...Array.from({ length: 20 }, () => ({ lng: 135.5, lat: 34.69 })),
      ...Array.from({ length: 20 }, () => ({ lng: 130.4, lat: 33.59 })),
      ...Array.from({ length: 20 }, () => ({ lng: 127.68, lat: 26.21 })),
    ];
    const nationwide = workFocusFrame(spread);
    expect(nationwide?.spansCountry).toBe(true);
    expect(focusZoom(4.2, true)).toBe(5);
    expect(focusZoom(6.1, true)).toBe(6.1);
  });

  it("frames 呪術廻戦, ゆるキャン△, and 君の名は。 from the catalog", () => {
    const spots = (
      JSON.parse(readFileSync("public/data/seo/spots-nav.json", "utf8")) as {
        spots: unknown[][];
      }
    ).spots;
    const frameFor = (subjectId: string) => {
      const points = spots
        .filter((row) => row[1] === subjectId)
        .map((row) => ({ lng: Number(row[4]), lat: Number(row[3]) }));
      return { count: points.length, frame: workFocusFrame(points) };
    };
    const jujutsu = frameFor("294993");
    expect(jujutsu.count).toBe(133);
    expect(jujutsu.frame?.spansCountry).toBe(false);
    expect(jujutsu.frame?.west).toBeGreaterThan(139.4);
    expect(jujutsu.frame?.east).toBeLessThan(140);
    expect(jujutsu.frame?.south).toBeGreaterThan(35.3);
    expect(jujutsu.frame?.north).toBeLessThan(36);

    const yuru = frameFor("207195");
    expect(yuru.count).toBe(785);
    expect(yuru.frame?.spansCountry).toBe(false);
    expect(yuru.frame?.points.length).toBeGreaterThanOrEqual(628);
    expect((yuru.frame?.east ?? 0) - (yuru.frame?.west ?? 0)).toBeGreaterThan(2);
    expect((yuru.frame?.east ?? 0) - (yuru.frame?.west ?? 0)).toBeLessThan(4);

    const kimi = frameFor("160209");
    expect(kimi.count).toBe(90);
    expect(kimi.frame?.spansCountry).toBe(false);
    expect(kimi.frame?.west).toBeGreaterThan(134);
    expect(kimi.frame?.east).toBeLessThan(141);
    expect(kimi.frame?.south).toBeGreaterThan(34);
    expect(kimi.frame?.north).toBeLessThan(37);
  });
});
