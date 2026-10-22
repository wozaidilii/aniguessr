import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMunicipalities } from "./japan-area.mjs";
import {
  buildGazetteer,
  containsSimplifiedJa,
  doubledPrefecture,
  fieldKind,
  mismatchedAdjacent,
  strictRewrite,
} from "./strict-place-copy.mjs";

const { places } = loadMunicipalities(
  path.join(process.cwd(), "scripts/data/japan-municipalities.json"),
);
const gazetteer = buildGazetteer(places);
const fujisawa = places.find((place) => place.ja === "藤沢市");
const hamura = places.find((place) => place.ja === "羽村市");

describe("strict place copy", () => {
  it("replaces one city in a sentence that says where the spot is", () => {
    expect(
      strictRewrite(
        "このシーンは第1話の約20分14秒に登場。現実のカフェは神奈川県鎌倉市にあります。",
        fujisawa,
        "ja",
        "funfact",
        gazetteer,
      ),
    ).toBe(
      "このシーンは第1話の約20分14秒に登場。現実のカフェは神奈川県藤沢市にあります。",
    );
    expect(
      strictRewrite(
        "该场景出现在第1集约20分14秒处，现实中的咖啡店位于神奈川县镰仓市。",
        fujisawa,
        "zh",
        "funfact",
        gazetteer,
      ),
    ).toContain("藤泽市");
    expect(
      strictRewrite(
        "This scene appears at approximately 20:14 in episode 1; the real café is located in Kamakura, Kanagawa Prefecture.",
        fujisawa,
        "en",
        "funfact",
        gazetteer,
      ),
    ).toContain("Fujisawa");
  });

  it("leaves titles, arcs, scenery compounds, and story settings unchanged", () => {
    const taki =
      "The three (Taki, Okudera, and Teshigawara) meet here before heading to the platform.";
    expect(strictRewrite(taki, fujisawa, "en", "description", gazetteer)).toBe(taki);
    expect(fieldKind("locales.en.description")).toBe("blocked");
    expect(
      strictRewrite(
        "This scene appears in Episode 22 (Shibuya Incident arc).",
        fujisawa,
        "en",
        "funfact",
        gazetteer,
      ),
    ).toBe("This scene appears in Episode 22 (Shibuya Incident arc).");
    expect(
      strictRewrite("Episode 61 (Hokuto Cup arc)", fujisawa, "en", "funfact", gazetteer),
    ).toBe("Episode 61 (Hokuto Cup arc)");
    expect(
      strictRewrite(
        "构成了一幅典型的港区风景。",
        places.find((place) => place.ja === "横浜市西区"),
        "zh",
        "funfact",
        gazetteer,
      ),
    ).toBe("构成了一幅典型的港区风景。");
    expect(
      strictRewrite(
        "舞台は北海道だが、ロケ地は宮城県だ。",
        fujisawa,
        "ja",
        "funfact",
        gazetteer,
      ),
    ).toContain("北海道");
    expect(
      strictRewrite(
        "現実の古河パン屋のモデルは東京都西東京市田無町にある「パン工房」です。",
        hamura,
        "ja",
        "funfact",
        gazetteer,
      ),
    ).toContain("西東京市");
    const okayama = places.find((place) => place.ja === "岡山市北区");
    const quoted =
      "The real model for this scene is the salon “6.5 Warm Talk” located in Okayama Prefecture.";
    expect(strictRewrite(quoted, okayama, "en", "funfact", gazetteer)).toBe(quoted);
    const obama = places.find((place) => place.ja === "小浜市");
    const temple =
      "The real-life location of this pilgrimage spot is the temple 'Kūin-ji' in Gobō, Wakayama Prefecture.";
    expect(strictRewrite(temple, obama, "en", "funfact", gazetteer)).toBe(temple);
  });

  it("rejects doubled prefectures, mismatched pairs, simplified ja, and Tokyo Prefecture", () => {
    expect(doubledPrefecture("東京都東京都港区")).toBe(true);
    expect(doubledPrefecture("神奈川県藤沢市")).toBe(false);
    expect(mismatchedAdjacent("埼玉県横浜市", gazetteer).length).toBeGreaterThan(0);
    expect(mismatchedAdjacent("埼玉県つくば市", gazetteer).length).toBeGreaterThan(0);
    expect(mismatchedAdjacent("神奈川県藤沢市", gazetteer)).toEqual([]);
    expect(containsSimplifiedJa("横滨市西区の風景")).toBe(true);
    expect(containsSimplifiedJa("横浜市西区の風景")).toBe(false);
    const styled = strictRewrite(
      "The shop is located in Tokyo Prefecture.",
      fujisawa,
      "en",
      "funfact",
      gazetteer,
    );
    expect(styled).not.toContain("Tokyo Prefecture");
    expect(styled).not.toContain("Hokkaido Prefecture");
    expect(
      strictRewrite(
        "実在のモデルは東京都藤沢市にある遊行寺です。",
        fujisawa,
        "ja",
        "funfact",
        gazetteer,
      ),
    ).toBe("実在のモデルは神奈川県藤沢市にある遊行寺です。");
  });

  it("keeps the repaired corpus free of the #33 place-copy failures", () => {
    const edits = JSON.parse(
      readFileSync(path.join(process.cwd(), "scripts/data/spot-copy-edits.json"), "utf8"),
    );
    expect(edits.ids).toHaveLength(1391);
    expect(edits.restored).toBe(4425);
    expect(new Set(edits.ids).size).toBe(1391);
    for (const row of edits.edits) {
      expect(doubledPrefecture(row.to)).toBe(false);
      expect(mismatchedAdjacent(row.to, gazetteer)).toEqual([]);
      if (row.field.startsWith("locales.ja.")) {
        expect(containsSimplifiedJa(row.to)).toBe(false);
      }
      if (row.field.startsWith("locales.en.")) {
        expect(row.to).not.toMatch(/Tokyo Prefecture|Hokkaido Prefecture/u);
      }
      const bare = row.field.replace(/^locales\.(?:ja|en)\./u, "").replace(/\[\d+\]$/u, "");
      expect(["description", "episodeContext", "title"]).not.toContain(bare);
    }

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
    const idSet = new Set(edits.ids);
    const idRe = /"id": "(anitabi_[^"]+)"/g;
    let match = idRe.exec(raw);
    while (match) {
      if (idSet.has(match[1])) {
        const start = raw.lastIndexOf("\n    {", match.index);
        const next = raw.indexOf("\n    {", start + 4);
        const slice = raw.slice(start, next < 0 ? undefined : next);
        expect(slice).not.toContain("東京都東京都");
        expect(slice).not.toContain("埼玉県横浜");
        expect(slice).not.toContain("埼玉県つくば");
        expect(slice).not.toContain("Tokyo Prefecture");
        expect(slice).not.toContain("Hokkaido Prefecture");
      }
      match = idRe.exec(raw);
    }

    const taki = load("anitabi_160209_3ik9kja4");
    expect(taki.locales.en.description).toContain("Taki");
    expect(taki.locales.en.description).not.toContain("Nagoya");
    const date = load("anitabi_160209_3ik9kjb8");
    expect(date.locales.en.episodeContext).toContain("(date segment)");
    expect(date.locales.en.episodeContext).not.toContain("Shibuya");
    const shibuya = load("anitabi_294993_lrhfsta2p");
    expect(shibuya.locales.en.episodeContext).toContain("Shibuya Incident arc");
    expect(shibuya.locales.en.episodeContext).not.toContain("Naka-ku");
    const hokuto = load("anitabi_605_umk0cgt9s");
    expect(hokuto.locales.en.episodeContext).toContain("Hokuto Cup arc");
    expect(hokuto.locales.en.episodeContext).not.toContain("Onomichi");
    expect(hokuto.locales.en.funfact[0]).toContain("Okayama");
    expect(hokuto.locales.ja.funfact[0]).toContain("岡山県");
    const harbor = load("anitabi_102134_9xqtj1b");
    expect(harbor.description).toContain("港区风景");

    const benten = load("anitabi_364252_jsf4ib19d");
    const bentenJa = benten.locales.ja.funfact[0];
    const bentenEn = benten.locales.en.funfact[0];
    expect(bentenJa).toContain("藤沢市");
    expect(bentenJa).not.toContain("鎌倉");
    expect(bentenJa).not.toContain("江ノ電");
    expect(bentenEn).toContain("Fujisawa");
    expect(bentenEn).not.toContain("Kamakura");
    expect(bentenEn).not.toMatch(/Enoden/iu);
  });
});
