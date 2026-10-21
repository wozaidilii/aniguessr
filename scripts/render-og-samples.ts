import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAreaCard, buildSpotCard, buildWorkCard, type OgNames } from "~/lib/og/card";
import { renderOgCard } from "~/server/og/respond";

function names(ja: string, zh = ja, tw = zh, en = ja): OgNames {
  return { ja, zh, "zh-tw": tw, en };
}

const outDir = process.argv[2] ?? path.join(process.cwd(), "output/og-samples");
await mkdir(outDir, { recursive: true });

const samples = {
  "spot-ja": buildSpotCard({
    requestedLocale: "ja",
    spotName: names("鎌倉高校前駅の踏切"),
    workTitle: names("青春ブタ野郎はバニーガール先輩の夢を見ない"),
    areaName: names("鎌倉・江ノ島"),
    otherWorkCount: 0,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "spot-zh": buildSpotCard({
    requestedLocale: "zh",
    spotName: names("镰仓高校前站旁的道口", "镰仓高校前站旁的道口"),
    workTitle: names("青春猪头少年不会梦到兔女郎学姐", "青春猪头少年不会梦到兔女郎学姐"),
    areaName: names("镰仓・江之岛", "镰仓・江之岛"),
    otherWorkCount: 0,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "spot-zh-tw": buildSpotCard({
    requestedLocale: "zh-tw",
    spotName: names("鎌倉高校前站旁的平交道", "镰仓高校前站旁的道口", "鎌倉高校前站旁的平交道"),
    workTitle: names(
      "青春豬頭少年不會夢到兔女郎學姊",
      "青春猪头少年不会梦到兔女郎学姐",
      "青春豬頭少年不會夢到兔女郎學姊",
    ),
    areaName: names("鎌倉・江之島", "镰仓・江之岛", "鎌倉・江之島"),
    otherWorkCount: 0,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "spot-en": buildSpotCard({
    requestedLocale: "en",
    spotName: names(
      "Railroad crossing",
      "道口",
      "平交道",
      "Railroad crossing at Kamakura-Kōkōmae Station",
    ),
    workTitle: names(
      "青春ブタ",
      "猪头少年",
      "豬頭少年",
      "Rascal Does Not Dream of Bunny Girl Senpai",
    ),
    areaName: names("鎌倉", "镰仓", "鎌倉", "Kamakura & Enoshima"),
    otherWorkCount: 0,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "spot-ja-long": buildSpotCard({
    requestedLocale: "ja",
    spotName: names("江ノ島電鉄 鎌倉高校前駅 下りホーム東端から見た七里ヶ浜の海と江の島"),
    workTitle: names(
      "ラブライブ！虹ヶ咲学園スクールアイドル同好会 完結編 第1章 劇場版スペシャルエディション",
    ),
    areaName: names("鎌倉・江ノ島"),
    otherWorkCount: 0,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "spot-ja-multi-long": buildSpotCard({
    requestedLocale: "ja",
    spotName: names("江ノ島電鉄 鎌倉高校前駅 下りホーム東端から見た七里ヶ浜の海と江の島"),
    workTitle: names(
      "ラブライブ！虹ヶ咲学園スクールアイドル同好会 完結編 第1章 劇場版スペシャルエディション",
    ),
    areaName: names("鎌倉・江ノ島"),
    otherWorkCount: 12,
    art: "coast",
    origin: { lat: 35.306, lng: 139.498 },
    nearby: [],
  }),
  "work-ja": buildWorkCard({
    requestedLocale: "ja",
    title: names("青春ブタ野郎はバニーガール先輩の夢を見ない"),
    spotCount: 42,
    areas: [names("鎌倉・江ノ島"), names("藤沢"), names("横浜")],
    points: [
      { lat: 35.3, lng: 139.48 },
      { lat: 35.31, lng: 139.5 },
      { lat: 35.33, lng: 139.49 },
      { lat: 35.32, lng: 139.55 },
    ],
    art: "coast",
  }),
  "work-zh": buildWorkCard({
    requestedLocale: "zh",
    title: names("青春猪头少年不会梦到兔女郎学姐", "青春猪头少年不会梦到兔女郎学姐"),
    spotCount: 42,
    areas: [
      names("镰仓・江之岛", "镰仓・江之岛"),
      names("藤泽", "藤泽"),
      names("横滨", "横滨"),
    ],
    points: [
      { lat: 35.3, lng: 139.48 },
      { lat: 35.31, lng: 139.5 },
    ],
    art: "coast",
  }),
  "work-zh-tw": buildWorkCard({
    requestedLocale: "zh-tw",
    title: names("青春ブタ", "青春猪头", "青春豬頭少年不會夢到兔女郎學姊"),
    spotCount: 42,
    areas: [names("鎌倉", "镰仓", "鎌倉・江之島")],
    points: [{ lat: 35.3, lng: 139.48 }],
    art: "coast",
  }),
  "work-en": buildWorkCard({
    requestedLocale: "en",
    title: names("a", "b", "c", "Rascal Does Not Dream of Bunny Girl Senpai"),
    spotCount: 42,
    areas: [
      names("a", "b", "c", "Kamakura & Enoshima"),
      names("a", "b", "c", "Fujisawa"),
      names("a", "b", "c", "Yokohama"),
    ],
    points: [
      { lat: 35.3, lng: 139.48 },
      { lat: 35.4, lng: 139.6 },
    ],
    art: "coast",
  }),
  "area-ja": buildAreaCard({
    requestedLocale: "ja",
    title: names("鎌倉・江ノ島"),
    workCount: 38,
    spotCount: 412,
    works: [
      names("青春ブタ野郎はバニーガール先輩の夢を見ない"),
      names("TARI TARI"),
      names("つり球"),
    ],
    points: [
      { lat: 35.3, lng: 139.48 },
      { lat: 35.301, lng: 139.481 },
      { lat: 35.32, lng: 139.5 },
      { lat: 35.33, lng: 139.55 },
    ],
    art: "coast",
  }),
  "area-zh": buildAreaCard({
    requestedLocale: "zh",
    title: names("镰仓・江之岛", "镰仓・江之岛"),
    workCount: 38,
    spotCount: 412,
    works: [names("青春猪头少年不会梦到兔女郎学姐", "青春猪头少年不会梦到兔女郎学姐")],
    points: [{ lat: 35.3, lng: 139.48 }],
    art: "coast",
  }),
  "area-zh-tw": buildAreaCard({
    requestedLocale: "zh-tw",
    title: names("鎌倉", "镰仓", "鎌倉・江之島"),
    workCount: 38,
    spotCount: 412,
    works: [names("作品", "作品", "青春豬頭少年不會夢到兔女郎學姊")],
    points: [{ lat: 35.3, lng: 139.48 }],
    art: "coast",
  }),
  "area-en": buildAreaCard({
    requestedLocale: "en",
    title: names("a", "b", "c", "Kamakura & Enoshima"),
    workCount: 38,
    spotCount: 1,
    works: [names("a", "b", "c", "Rascal Does Not Dream of Bunny Girl Senpai")],
    points: [{ lat: 35.3, lng: 139.48 }],
    art: "city",
  }),
};

for (const [name, card] of Object.entries(samples)) {
  const response = await renderOgCard(card);
  if (!response.ok) throw new Error(`${name} ${response.status}`);
  const file = path.join(outDir, `${name}.png`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log(name, response.headers.get("cache-control"), file);
}
