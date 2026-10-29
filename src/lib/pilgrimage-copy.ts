import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";

export const PILGRIMAGE_COPY: Record<
  PilgrimageLocale,
  {
    siteKicker: string;
    hubTitle: string;
    hubDescription: string;
    animeArchive: string;
    locationArchive: string;
    spotCountLabel: (count: number) => string;
    animeCountLabel: (count: number) => string;
    locationCountLabel: (count: number) => string;
    playGame: string;
    backHub: string;
    backAnime: string;
    backLocation: string;
    spotsInAnime: (title: string, count: number) => string;
    spotsInLocation: (name: string, count: number) => string;
    spotDetail: string;
    answerName: string;
    episode: string;
    funfacts: string;
    coordinates: string;
    openMaps: string;
    relatedAnime: string;
    relatedLocation: string;
    samePlaceWorks: string;
    samePlaceSiblings: string;
    emptyIndex: string;
    locationSpotIndex: string;
    locationSpotIndexMore: (count: number) => string;
    searchWorks: string;
    searchWorksEmpty: string;
    alsoKnownAs: string;
    viewSpot: string;
    seoSpotTitle: (anime: string, place: string) => string;
    seoSpotDescription: (
      anime: string,
      place: string,
      location: string,
    ) => string;
    seoAnimeTitle: (title: string, count: number) => string;
    seoAnimeDescription: (title: string, count: number) => string;
    seoLocationTitle: (name: string, count: number) => string;
    seoLocationDescription: (name: string, count: number) => string;
    favoritesTitle: string;
    favoritesHint: string;
    favoritesSearch: string;
    favoritesNone: string;
    favoritesCount: (count: number) => string;
    favoritesClear: string;
    favoritesEmpty: string;
    editFavorites: string;
    mapTitle: string;
    mapLoading: string;
    mapUnavailable: string;
    mapShowFavorites: string;
    mapShowAll: string;
    mapEmpty: string;
    nearMeTitle: string;
    nearMeHint: string;
    nearMeAction: string;
    nearMeLocating: string;
    nearMeDenied: string;
    nearMeUnavailable: string;
    nearMeEmpty: string;
    nearMeFavorites: string;
    nearMeOthers: string;
    navigate: string;
    streetView: string;
    favoriteBadge: string;
    formatDistance: (km: number) => string;
  }
> = {
  zh: {
    siteKicker: "圣地巡礼档案",
    hubTitle: "动漫圣地巡礼地图",
    hubDescription:
      "收录日本动画取景地的真实坐标、场景描述与巡礼贴士。按番剧或城市浏览，也可在 AniGuessr 里用街景验证你的判断。",
    animeArchive: "按番剧浏览",
    locationArchive: "按地区浏览",
    spotCountLabel: (count) => `${count.toLocaleString()} 处取景地`,
    animeCountLabel: (count) => `${count.toLocaleString()} 部作品`,
    locationCountLabel: (count) => `${count.toLocaleString()} 个地区`,
    playGame: "在 AniGuessr 挑战",
    backHub: "返回巡礼目录",
    backAnime: "番剧列表",
    backLocation: "地区列表",
    spotsInAnime: (title, count) => `《${title}》圣地巡礼 · ${count} 处`,
    spotsInLocation: (name, count) => `${name} 动画取景 · ${count} 处`,
    spotDetail: "取景地详情",
    answerName: "现实地点",
    episode: "出现场景",
    funfacts: "巡礼贴士",
    coordinates: "坐标",
    openMaps: "在 Google 地图打开",
    relatedAnime: "所属作品",
    relatedLocation: "所在地区",
    samePlaceWorks: "同一地点出现的作品：",
    samePlaceSiblings: "同一作品的附近地点：",
    emptyIndex: "SEO 索引尚未生成，请先运行 npm run data:build-pilgrimage-seo",
    locationSpotIndex: "本页全部取景地",
    locationSpotIndexMore: (count) => `其余 ${count.toLocaleString()} 处（链接索引）`,
    searchWorks: "搜索作品名",
    searchWorksEmpty: "没有找到相关作品",
    alsoKnownAs: "别名",
    viewSpot: "查看详情",
    seoSpotTitle: (anime, place) => `${anime} 圣地：${place}`,
    seoSpotDescription: (anime, place, location) =>
      `${anime} 取景地「${place}」（${location}）。真实坐标、场景描述与圣地巡礼指南，可在 AniGuessr 街景模式中验证。`,
    seoAnimeTitle: (title, count) => `${title} 圣地巡礼地点大全（${count} 处）`,
    seoAnimeDescription: (title, count) =>
      `整理《${title}》在日本的真实取景地共 ${count} 处，含地点名称、场景线索与地图坐标。`,
    seoLocationTitle: (name, count) => `${name} 动画圣地巡礼（${count} 处）`,
    seoLocationDescription: (name, count) =>
      `${name} 共收录 ${count} 处日本动画取景地，按作品分类，适合规划圣地巡礼路线。`,
    favoritesTitle: "想去的番剧",
    favoritesHint:
      "勾选想巡礼的作品。选择保存在这台设备上，无需登录。页面内容对所有访客相同。",
    favoritesSearch: "搜索番剧",
    favoritesNone: "尚未选择，地图会显示全部取景地",
    favoritesCount: (count) => `已选 ${count.toLocaleString()} 部`,
    favoritesClear: "清除选择",
    favoritesEmpty: "没有匹配的番剧",
    editFavorites: "选择番剧",
    mapTitle: "巡礼地图",
    mapLoading: "正在加载地图…",
    mapUnavailable: "地图暂时无法加载",
    mapShowFavorites: "只看想去的番剧",
    mapShowAll: "显示全部",
    mapEmpty: "当前筛选没有取景地",
    nearMeTitle: "附近的圣地",
    nearMeHint:
      "使用浏览器定位，在这台设备上计算距离，不会把位置发送到服务器。",
    nearMeAction: "查找附近",
    nearMeLocating: "正在定位…",
    nearMeDenied: "无法获取位置。请在浏览器中允许定位，或继续用地图浏览。",
    nearMeUnavailable: "这部浏览器不支持定位。",
    nearMeEmpty: "附近没有取景地",
    nearMeFavorites: "想去的番剧",
    nearMeOthers: "其他取景地",
    navigate: "导航",
    streetView: "街景",
    favoriteBadge: "想去",
    formatDistance: (km) => formatDistanceLabel(km, "zh"),
  },
  ja: {
    siteKicker: "聖地巡礼アーカイブ",
    hubTitle: "アニメ聖地巡礼マップ",
    hubDescription:
      "日本のアニメ撮影地の座標・シーン説明・巡礼ヒントを収録。作品別・地域別に閲覧し、AniGuessr のストリートビューで当てっこもできます。",
    animeArchive: "作品から探す",
    locationArchive: "地域から探す",
    spotCountLabel: (count) => `撮影地 ${count.toLocaleString()} 件`,
    animeCountLabel: (count) => `作品 ${count.toLocaleString()} 本`,
    locationCountLabel: (count) => `地域 ${count.toLocaleString()} 件`,
    playGame: "AniGuessr で挑戦",
    backHub: "巡礼目録へ",
    backAnime: "作品一覧",
    backLocation: "地域一覧",
    spotsInAnime: (title, count) => `『${title}』聖地巡礼 · ${count} 件`,
    spotsInLocation: (name, count) => `${name} のアニメロケ · ${count} 件`,
    spotDetail: "撮影地詳細",
    answerName: "現実の場所",
    episode: "登場シーン",
    funfacts: "巡礼メモ",
    coordinates: "座標",
    openMaps: "Google マップで開く",
    relatedAnime: "作品",
    relatedLocation: "地域",
    samePlaceWorks: "同じ場所が登場する作品：",
    samePlaceSiblings: "同じ作品の近くのスポット：",
    emptyIndex:
      "SEO インデックス未生成。npm run data:build-pilgrimage-seo を実行してください",
    locationSpotIndex: "このページの撮影地一覧",
    locationSpotIndexMore: (count) => `ほか ${count.toLocaleString()} 件（リンク索引）`,
    searchWorks: "作品名で検索",
    searchWorksEmpty: "該当する作品が見つかりません",
    alsoKnownAs: "別名",
    viewSpot: "詳細を見る",
    seoSpotTitle: (anime, place) => `${anime} 聖地：${place}`,
    seoSpotDescription: (anime, place, location) =>
      `『${anime}』の撮影地「${place}」（${location}）。座標・シーン説明・巡礼ガイド。AniGuessr ストリートビューで検証できます。`,
    seoAnimeTitle: (title, count) =>
      `『${title}』聖地巡礼リスト（${count} 件）`,
    seoAnimeDescription: (title, count) =>
      `『${title}』の日本国内ロケ地 ${count} 件を整理。場所名・シーン手がかり・地図座標付き。`,
    seoLocationTitle: (name, count) => `${name} アニメ聖地巡礼（${count} 件）`,
    seoLocationDescription: (name, count) =>
      `${name} のアニメ撮影地 ${count} 件を作品別に収録。聖地巡礼ルートの参考に。`,
    favoritesTitle: "行きたい作品",
    favoritesHint:
      "巡礼したい作品を選びます。この端末に保存され、ログインは不要です。ページの内容は誰が見ても同じです。",
    favoritesSearch: "作品を検索",
    favoritesNone: "未選択です。地図はすべての撮影地を表示します",
    favoritesCount: (count) => `${count.toLocaleString()} 作品を選択中`,
    favoritesClear: "選択を解除",
    favoritesEmpty: "一致する作品がありません",
    editFavorites: "作品を選ぶ",
    mapTitle: "巡礼マップ",
    mapLoading: "地図を読み込んでいます…",
    mapUnavailable: "地図を読み込めませんでした",
    mapShowFavorites: "行きたい作品だけ",
    mapShowAll: "すべて表示",
    mapEmpty: "この条件の撮影地はありません",
    nearMeTitle: "近くの聖地",
    nearMeHint:
      "ブラウザの位置情報を使い、距離はこの端末で計算します。位置情報はサーバーに送りません。",
    nearMeAction: "近くを探す",
    nearMeLocating: "現在地を取得しています…",
    nearMeDenied:
      "位置情報を取得できません。ブラウザで許可するか、地図から探してください。",
    nearMeUnavailable: "このブラウザは位置情報に対応していません。",
    nearMeEmpty: "近くに撮影地がありません",
    nearMeFavorites: "行きたい作品",
    nearMeOthers: "その他の撮影地",
    navigate: "ナビ",
    streetView: "ストリートビュー",
    favoriteBadge: "行きたい",
    formatDistance: (km) => formatDistanceLabel(km, "ja"),
  },
  en: {
    siteKicker: "Pilgrimage Archive",
    hubTitle: "Anime Pilgrimage Location Guide",
    hubDescription:
      "Real-world coordinates, scene notes, and visit tips for anime real-life locations across Japan. Browse by series or region, then test yourself in AniGuessr Street View.",
    animeArchive: "Browse by anime",
    locationArchive: "Browse by region",
    spotCountLabel: (count) => `${count.toLocaleString()} real-life locations`,
    animeCountLabel: (count) => `${count.toLocaleString()} series`,
    locationCountLabel: (count) => `${count.toLocaleString()} regions`,
    playGame: "Play on AniGuessr",
    backHub: "Back to archive",
    backAnime: "All anime",
    backLocation: "All regions",
    spotsInAnime: (title, count) => `${title} pilgrimage · ${count} spots`,
    spotsInLocation: (name, count) =>
      `${name} anime locations · ${count} spots`,
    spotDetail: "Spot details",
    answerName: "Real-world place",
    episode: "Scene context",
    funfacts: "Visit notes",
    coordinates: "Coordinates",
    openMaps: "Open in Google Maps",
    relatedAnime: "Anime",
    relatedLocation: "Region",
    samePlaceWorks: "Also in these works: ",
    samePlaceSiblings: "Other spots from this work: ",
    emptyIndex:
      "SEO index not built yet. Run npm run data:build-pilgrimage-seo first.",
    locationSpotIndex: "All spots on this page",
    locationSpotIndexMore: (count) =>
      `${count.toLocaleString()} more spots (link index)`,
    searchWorks: "Search anime titles",
    searchWorksEmpty: "No matching titles",
    alsoKnownAs: "Also known as",
    viewSpot: "View details",
    seoSpotTitle: (anime, place) => `${anime} pilgrimage: ${place}`,
    seoSpotDescription: (anime, place, location) =>
      `${anime} real-life location “${place}” in ${location}. Coordinates, scene notes, and pilgrimage tips — playable in AniGuessr Street View.`,
    seoAnimeTitle: (title, count) => `${title} pilgrimage locations (${count})`,
    seoAnimeDescription: (title, count) =>
      `${count} real-life ${title} locations in Japan with place names, scene clues, and map coordinates.`,
    seoLocationTitle: (name, count) =>
      `${name} anime pilgrimage guide (${count})`,
    seoLocationDescription: (name, count) =>
      `${count} anime real-life locations in ${name}, grouped by series for route planning.`,
    favoritesTitle: "Favorite anime",
    favoritesHint:
      "Pick the anime you want to visit. Saved on this device, no login required. Page content stays the same for every visitor.",
    favoritesSearch: "Search anime",
    favoritesNone: "None selected. The map shows every spot.",
    favoritesCount: (count) => `${count.toLocaleString()} selected`,
    favoritesClear: "Clear",
    favoritesEmpty: "No matching anime",
    editFavorites: "Choose anime",
    mapTitle: "Pilgrimage map",
    mapLoading: "Loading map…",
    mapUnavailable: "The map couldn't load",
    mapShowFavorites: "Favorites only",
    mapShowAll: "Show all",
    mapEmpty: "No spots match this filter",
    nearMeTitle: "Near me",
    nearMeHint:
      "Uses your browser location. Distance is calculated on this device and your location is never sent to the server.",
    nearMeAction: "Near me",
    nearMeLocating: "Finding your location…",
    nearMeDenied:
      "Location is unavailable. Allow it in the browser, or keep browsing the map.",
    nearMeUnavailable: "This browser doesn't support location.",
    nearMeEmpty: "No spots found nearby",
    nearMeFavorites: "Favorites",
    nearMeOthers: "Other spots",
    navigate: "Navigate",
    streetView: "Street View",
    favoriteBadge: "Favorite",
    formatDistance: (km) => formatDistanceLabel(km, "en"),
  },
  // OpenCC s2twp of the zh block, plus scripts/data/zh-tw-overrides.json.
  // Committed so the client bundle does not import opencc.
  "zh-tw": {
    siteKicker: "聖地巡禮檔案",
    hubTitle: "動漫聖地巡禮地圖",
    hubDescription:
      "收錄日本動畫取景地的真實座標、場景描述與巡禮貼士。按番劇或城市瀏覽，也可在 AniGuessr 裡用街景驗證你的判斷。",
    animeArchive: "按番劇瀏覽",
    locationArchive: "按地區瀏覽",
    spotCountLabel: (count) => `${count.toLocaleString()} 處取景地`,
    animeCountLabel: (count) => `${count.toLocaleString()} 部作品`,
    locationCountLabel: (count) => `${count.toLocaleString()} 個地區`,
    playGame: "在 AniGuessr 挑戰",
    backHub: "返回巡禮目錄",
    backAnime: "番劇列表",
    backLocation: "地區列表",
    spotsInAnime: (title, count) => `《${title}》聖地巡禮 · ${count} 處`,
    spotsInLocation: (name, count) => `${name} 動畫取景 · ${count} 處`,
    spotDetail: "取景地詳情",
    answerName: "現實地點",
    episode: "出現場景",
    funfacts: "巡禮貼士",
    coordinates: "座標",
    openMaps: "在 Google 地圖開啟",
    relatedAnime: "所屬作品",
    relatedLocation: "所在地區",
    samePlaceWorks: "同一地點出現的作品：",
    samePlaceSiblings: "同一作品的附近地點：",
    emptyIndex: "SEO 索引尚未生成，請先執行 npm run data:build-pilgrimage-seo",
    locationSpotIndex: "本頁全部取景地",
    locationSpotIndexMore: (count) => `其餘 ${count.toLocaleString()} 處（連結索引）`,
    searchWorks: "搜尋作品名稱",
    searchWorksEmpty: "找不到相關作品",
    alsoKnownAs: "別名",
    viewSpot: "檢視詳情",
    seoSpotTitle: (anime, place) => `${anime} 聖地：${place}`,
    seoSpotDescription: (anime, place, location) =>
      `${anime} 取景地「${place}」（${location}）。真實座標、場景描述與聖地巡禮指南，可在 AniGuessr 街景模式中驗證。`,
    seoAnimeTitle: (title, count) => `${title} 聖地巡禮地點大全（${count} 處）`,
    seoAnimeDescription: (title, count) =>
      `整理《${title}》在日本的實景取景地共 ${count} 處，含地點名稱、場景線索與地圖座標。`,
    seoLocationTitle: (name, count) => `${name} 動畫聖地巡禮（${count} 處）`,
    seoLocationDescription: (name, count) =>
      `${name} 共收錄 ${count} 處日本動畫取景地，按作品分類，適合規劃聖地巡禮路線。`,
    favoritesTitle: "想去的番劇",
    favoritesHint:
      "勾選想巡禮的作品。選擇儲存在這臺裝置上，無需登入。頁面內容對所有訪客相同。",
    favoritesSearch: "搜尋番劇",
    favoritesNone: "尚未選擇，地圖會顯示全部取景地",
    favoritesCount: (count) => `已選 ${count.toLocaleString()} 部`,
    favoritesClear: "清除選擇",
    favoritesEmpty: "沒有匹配的番劇",
    editFavorites: "選擇番劇",
    mapTitle: "巡禮地圖",
    mapLoading: "正在載入地圖…",
    mapUnavailable: "地圖暫時無法載入",
    mapShowFavorites: "只看想去的番劇",
    mapShowAll: "顯示全部",
    mapEmpty: "當前篩選沒有取景地",
    nearMeTitle: "附近的聖地",
    nearMeHint:
      "使用瀏覽器定位，在這臺裝置上計算距離，不會把位置傳送到伺服器。",
    nearMeAction: "查詢附近",
    nearMeLocating: "正在定位…",
    nearMeDenied: "無法獲取位置。請在瀏覽器中允許定位，或繼續用地圖瀏覽。",
    nearMeUnavailable: "這部瀏覽器不支援定位。",
    nearMeEmpty: "附近沒有取景地",
    nearMeFavorites: "想去的番劇",
    nearMeOthers: "其他取景地",
    navigate: "導航",
    streetView: "街景服務",
    favoriteBadge: "想去",
    formatDistance: (km) => formatDistanceLabel(km, "zh-tw"),
  },
};

function formatDistanceLabel(km: number, locale: PilgrimageLocale): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) {
    const meters = Math.max(1, Math.round(km * 1000));
    if (locale === "zh" || locale === "zh-tw") return `${meters} 米`;
    return `${meters} m`;
  }
  const value = km < 10 ? km.toFixed(1) : String(Math.round(km));
  if (locale === "zh" || locale === "zh-tw") return `${value} 公里`;
  return `${value} km`;
}

export function getPilgrimageCopy(locale: PilgrimageLocale) {
  return PILGRIMAGE_COPY[locale] ?? PILGRIMAGE_COPY.en;
}
