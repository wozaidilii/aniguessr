import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildForms,
  editQuestion,
  rewriteText,
} from "../fix-stale-place-copy.mjs";

const places = [
  {
    code: "14205",
    ja: "藤沢市",
    zh: "藤泽市",
    en: "Fujisawa, Kanagawa",
  },
  {
    code: "14204",
    ja: "鎌倉市",
    zh: "镰仓市",
    en: "Kamakura, Kanagawa",
  },
  {
    code: "40101",
    ja: "北九州市門司区",
    zh: "北九州市门司区",
    en: "Kitakyushu, Fukuoka",
  },
  {
    code: "01102",
    ja: "札幌市北区",
    zh: "札幌市北区",
    en: "Kita, Hokkaido",
  },
  {
    code: "01101",
    ja: "札幌市中央区",
    zh: "札幌市中央区",
    en: "Chuo, Hokkaido",
  },
  {
    code: "44204",
    ja: "国東市",
    zh: "国东市",
    en: "Kunisaki, Oita",
  },
  {
    code: "27206",
    ja: "貝塚市",
    zh: "贝冢市",
    en: "Kaizuka, Osaka",
  },
  {
    code: "28585",
    ja: "美方郡香美町",
    zh: "美方郡香美町",
    en: "Mikata, Hyogo",
  },
  {
    code: "30205",
    ja: "御坊市",
    zh: "御坊市",
    en: "Gobo, Wakayama",
  },
  {
    code: "01331",
    ja: "日高町",
    zh: "日高町",
    en: "Hidaka, Hokkaido",
  },
  {
    code: "13112",
    ja: "世田谷区",
    zh: "世田谷区",
    en: "Setagaya, Tokyo",
  },
  {
    code: "23204",
    ja: "瀬戸市",
    zh: "濑户市",
    en: "Seto, Aichi",
  },
];

const forms = buildForms(places);
const fujisawa = places[0];
const moji = places[2];
const chuo = places[4];

describe("stale place copy", () => {
  it("replaces a contradicted city and keeps a character name", () => {
    expect(rewriteText("神奈川県鎌倉市のカフェ", fujisawa, forms, 139.48, 35.3)).toBe(
      "神奈川県藤沢市のカフェ",
    );
    expect(
      rewriteText(
        "Yukito Kunisaki, on his journey",
        fujisawa,
        forms,
        139.48,
        35.3,
      ),
    ).toBe("Yukito Kunisaki, on his journey");
    expect(
      rewriteText("a house in Kunisaki, Oita Prefecture", fujisawa, forms, 139.48, 35.3),
    ).toBe("a house in Fujisawa, Kanagawa Prefecture");
    expect(rewriteText("In Seto no Hanayome, the group", fujisawa, forms, 139.48, 35.3)).toBe(
      "In Seto no Hanayome, the group",
    );
  });

  it("leaves river names, glosses, and story settings alone", () => {
    expect(rewriteText("Hidaka River mouth", fujisawa, forms, 139.48, 35.3)).toBe(
      "Hidaka River mouth",
    );
    expect(
      rewriteText("貝塚 (Kaizuka) in the town", fujisawa, forms, 139.48, 35.3),
    ).toContain("Kaizuka");
    expect(
      rewriteText("舞台は北海道だが、ロケ地は宮城県だ。", fujisawa, forms, 139.48, 35.3),
    ).toContain("北海道");
  });

  it("replaces a whole ward suffix instead of doubling -ku", () => {
    expect(
      rewriteText("Imai Shoten (Kita-ku, Sapporo)", chuo, forms, 141.35, 43.06),
    ).toBe("Imai Shoten (Chuo-ku, Sapporo)");
  });

  it("does not call a town a city or rewrite a school name", () => {
    const mikata = places.find((place) => place.code === "28585");
    expect(rewriteText("a house in Gobo City", mikata, forms, 134.5, 35.5)).toBe(
      "a house in Mikata",
    );
    expect(
      rewriteText("in Gobō, Wakayama Prefecture", mikata, forms, 134.5, 35.5),
    ).toBe("in Mikata, Hyogo Prefecture");
    expect(
      rewriteText(
        "based on Kamakura City Daiichi Junior High School",
        fujisawa,
        forms,
        139.48,
        35.3,
      ),
    ).toBe("based on Kamakura City Daiichi Junior High School");
    expect(
      rewriteText("located in Kamakura City, Kanagawa", fujisawa, forms, 139.48, 35.3),
    ).toBe("located in Fujisawa City, Kanagawa");
  });

  it("upgrades English to the ward only when Japanese already names it", () => {
    const named = editQuestion(
      {
        lng: 131,
        lat: 33.9,
        answerName: "白野江小学校（北九州市門司区）",
        locales: {
          ja: { answerName: "白野江小学校（北九州市門司区）" },
          en: { answerName: "Shiranoe Elementary School (Kitakyushu City)" },
        },
      },
      moji,
      forms,
    );
    expect(named.map((row) => row.to).join("\n")).toContain("Moji-ku");
    expect(named.map((row) => row.to).join("\n")).not.toContain("Kitakyushu");

    const bare = editQuestion(
      {
        lng: 139.5,
        lat: 35.5,
        answerName: "公園（東京都）",
        locales: {
          ja: { answerName: "公園（東京都）" },
          en: { answerName: "Park Pathway (Tokyo)" },
        },
      },
      places.find((place) => place.code === "13112"),
      forms,
    );
    const english = bare.find((row) => row.field === "locales.en.answerName");
    expect(english?.to ?? "Park Pathway (Tokyo)").toBe("Park Pathway (Tokyo)");
  });

  it("keeps the reviewed spot sentences aligned with the polygon", () => {
    const raw = readFileSync(
      path.join(process.cwd(), "public/data/anime-guessr-questions.json"),
      "utf8",
    );
    const load = (id) => {
      const at = raw.indexOf(`"id": ${JSON.stringify(id)}`);
      expect(at).toBeGreaterThan(0);
      const start = raw.lastIndexOf("\n    {", at);
      const next = raw.indexOf("\n    {", start + 4);
      return JSON.parse(raw.slice(start, next).trim().replace(/,$/u, ""));
    };
    const cafe = load("anitabi_37137_4slhba842");
    expect(cafe.location).toBe("镰仓市");
    expect(cafe.funfact[0]).toContain("藤泽市");
    expect(cafe.locales.ja.funfact[0]).toContain("藤沢市");
    expect(cafe.locales.en.funfact[0]).toContain("Fujisawa");
    expect(cafe.locales.ja.funfact[0]).not.toContain("鎌倉市");
    const furukawa = load("anitabi_51_sww4zc3ji");
    expect(furukawa.locales.en.answerName).toBe("Furukawa Bakery (Hamura)");
    const shiranoe = load("anitabi_234_5z3hugd");
    expect(shiranoe.locales.en.answerName).toContain("Moji-ku");
    expect(shiranoe.locales.ja.funfact.join("")).toContain("門司区");
    expect(shiranoe.locales.en.answerName).not.toContain("Kitakyushu");
    const hokkaido = load("anitabi_1931_50vjonq3x");
    const story = hokkaido.locales.ja.funfact.join("");
    expect(story).toContain("北海道");
    expect(story).toContain("宮城県");
  });
});
