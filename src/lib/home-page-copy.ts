import type { Metadata } from "next";
import { withAnimeLocale } from "~/lib/anime-locale";
import { type HomeLocale, homeSiteLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";
import { absoluteUrl, localeAlternates } from "~/lib/seo";
import {
  ANIME_GUESSR_DIFFICULTY_TIERS,
  type AnimeGuessrDifficultyTier,
} from "~/lib/anime-guessr";

export interface HomePageCopy {
  chip: string;
  h1Lead: string;
  h1Accent: string;
  h1Tail: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  privacy: string;
  nearbyTitle: string;
  drawerTitle: string;
  nearbySorted: string;
  navigate: string;
  streetView: string;
  /** Homepage map popup. Same-tab link to the spot page. */
  details: string;
  geoDenied: string;
  walkMinutes: (minutes: number) => string;
  statSpots: string;
  statAnime: string;
  statAreas: string;
  areasEyebrow: string;
  areasTitle: string;
  areasSubtitle: string;
  areasAll: string;
  animeEyebrow: string;
  animeTitle: string;
  animeSubtitle: string;
  animeAll: string;
  spotCount: (count: number) => string;
  animeMeta: (count: number, area: string) => string;
  howEyebrow: string;
  howTitle: string;
  howSubtitle: string;
  steps: Array<{ title: string; body: string }>;
  /** Kept for a spot or locale where Street View is unavailable. */
  step3Fallback: { title: string; body: string };
  gameEyebrow: string;
  gameTitle: string;
  /** May still change. Describes guessing the place from anime clues. */
  gameBody: string;
  gameBattle: string;
  gameRank: string;
  difficultyLabel: string;
  roundsLabel: string;
  roundsOption: (rounds: number) => string;
  difficultyOption: (tier: AnimeGuessrDifficultyTier) => string;
  start: string;
  navMap: string;
  navAnime: string;
  navAreas: string;
  navGame: string;
  navRank: string;
  login: string;
  logout: string;
  accountMenu: string;
  editProfile: string;
  cancel: string;
  profileTitle: string;
  username: string;
  country: string;
  countryUnset: string;
  saveProfile: string;
  saving: string;
  saved: string;
  menu: string;
  closeMenu: string;
  langLabel: string;
  searchPill: string;
  favoritesPill: string;
  zoomIn: string;
  zoomOut: string;
  locate: string;
  myLocation: string;
  mapLabel: string;
  searchWorks: string;
  searchWorksEmpty: string;
  searchClear: string;
  popularWorks: string;
  showAllWorks: string;
  popularAll: string;
  dismissPopular: string;
  clearWorkFilter: string;
  workPage: string;
  aroundCount: (count: number) => string;
  searchSpotCount: (count: number) => string;
  footerTagline: string;
  footerMap: string;
  footerGame: string;
  footerBrand: string;
  footerPrivacy: string;
  footerCopy: string;
  contactGeneral: string;
  contactSupport: string;
  rankTitle: string;
  rankBody: string;
  rankEmpty: string;
  rankLoading: string;
  rankYou: string;
  rankGuest: string;
  rankLogin: string;
  myRank: string;
}

const DIFFICULTY: Record<
  HomeLocale,
  Record<AnimeGuessrDifficultyTier, string>
> = {
  ja: {
    beginner: "入門",
    intermediate: "中級",
    master: "マスター",
    miracle: "エキスパート",
  },
  zh: {
    beginner: "入门",
    intermediate: "中级",
    master: "大师",
    miracle: "专家",
  },
  "zh-tw": {
    beginner: "入門",
    intermediate: "中級",
    master: "大師",
    miracle: "專家",
  },
  en: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    master: "Master",
    miracle: "Expert",
  },
};

function formatCount(locale: HomeLocale, count: number): string {
  const tag = locale === "zh-tw" ? "zh-TW" : locale;
  return count.toLocaleString(tag);
}

export const HOME_PAGE_COPY: Record<HomeLocale, HomePageCopy> = {
  ja: {
    chip: "聖地巡礼マップ",
    h1Lead: "アニメ",
    h1Accent: "聖地巡礼",
    h1Tail: "マップ",
    intro:
      "日本各地のアニメ聖地を地図で確認。今いる場所から近い聖地を探して、Googleマップでそのままナビ。作品別・エリア別にも探せます。",
    primaryCta: "近くの聖地を探す",
    secondaryCta: "地図をひらく",
    privacy:
      "位置情報は距離の計算にだけ使い、端末の中で処理します。サーバーには送信しません。",
    nearbyTitle: "近くの聖地",
    drawerTitle: "このエリアの人気スポット",
    nearbySorted: "現在地から近い順",
    navigate: "ナビ",
    streetView: "ストリートビュー",
    details: "詳しく",
    geoDenied: "位置情報を利用できないため、巡礼マップを開きます。",
    walkMinutes: (minutes) => `徒歩${minutes}分`,
    statSpots: "撮影地",
    statAnime: "作品",
    statAreas: "エリア",
    areasEyebrow: "AREAS",
    areasTitle: "人気の聖地巡礼エリア",
    areasSubtitle: "行き先の近くにある聖地を、まとめてチェック。",
    areasAll: "エリア一覧 →",
    animeEyebrow: "SERIES",
    animeTitle: "人気作品の聖地",
    animeSubtitle: "好きな作品の聖地を、地図でまとめてチェック。",
    animeAll: "作品一覧 →",
    spotCount: (count) => `撮影地 ${formatCount("ja", count)}件`,
    animeMeta: (count, area) =>
      area
        ? `撮影地 ${formatCount("ja", count)}件・${area}`
        : `撮影地 ${formatCount("ja", count)}件`,
    howEyebrow: "HOW IT WORKS",
    howTitle: "地図を見て、そのまま聖地へ。",
    howSubtitle: "3ステップで使えます。",
    steps: [
      {
        title: "位置情報をオン",
        body: "距離の計算にだけ使い、サーバーには送信しません。",
      },
      {
        title: "近くの聖地をチェック",
        body: "近い順に、作品名とスポットが並びます。",
      },
      {
        title: "ストリートビューで下見して、ナビで出発",
        body: "周りの様子を確認してから、Googleマップでそのまま向かえます。",
      },
    ],
    step3Fallback: {
      title: "ナビでそのまま出発",
      body: "「ナビ」を押すとGoogleマップが開きます。",
    },
    gameEyebrow: "MINI GAME",
    gameTitle: "聖地当てゲームでも遊べます",
    gameBody: "アニメのヒントから、どこの聖地か当ててみよう。",
    gameBattle: "対戦モード",
    gameRank: "ランキング",
    difficultyLabel: "難易度",
    roundsLabel: "ラウンド数",
    roundsOption: (rounds) => `${rounds}ラウンド`,
    difficultyOption: (tier) => DIFFICULTY.ja[tier],
    start: "ゲームをはじめる",
    navMap: "聖地マップ",
    navAnime: "作品から探す",
    navAreas: "エリアから探す",
    navGame: "聖地当てゲーム",
    navRank: "ランキング",
    login: "ログイン",
    logout: "ログアウト",
    accountMenu: "アカウントメニュー",
    editProfile: "プロフィールを編集",
    cancel: "キャンセル",
    profileTitle: "プレイヤー",
    username: "ユーザー名",
    country: "地域",
    countryUnset: "未設定",
    saveProfile: "保存",
    saving: "保存中...",
    saved: "保存しました",
    menu: "メニュー",
    closeMenu: "メニューを閉じる",
    langLabel: "言語",
    searchPill: "作品・エリアで探す",
    favoritesPill: "お気に入り",
    zoomIn: "拡大",
    zoomOut: "縮小",
    locate: "現在地",
    myLocation: "現在地",
    mapLabel: "アニメ聖地巡礼マップ",
    searchWorks: "作品名で検索",
    searchWorksEmpty: "該当する作品が見つかりません",
    searchClear: "クリア",
    popularWorks: "人気の作品から探す",
    showAllWorks: "すべて表示",
    popularAll: "すべて ›",
    dismissPopular: "人気の作品を閉じる",
    clearWorkFilter: "作品の絞り込みを解除",
    workPage: "作品ページへ",
    aroundCount: (count) => `この周辺 ${formatCount("ja", count)}件`,
    searchSpotCount: (count) => `${formatCount("ja", count)} か所`,
    footerTagline: "アニメ聖地巡礼マップと聖地当てゲーム。",
    footerMap: "MAP",
    footerGame: "GAME",
    footerBrand: "AYIORA",
    footerPrivacy: "プライバシーポリシー",
    footerCopy: "© 2026 Ayiora",
    contactGeneral: "提携・ご提案",
    contactSupport: "不具合・バグ報告",
    rankTitle: "ランキング",
    rankBody: "ラウンド数と難易度ごとのベストスコアです。",
    rankEmpty: "まだ記録がありません",
    rankLoading: "読み込み中...",
    rankYou: "あなた",
    rankGuest: "あなた（未ログイン）",
    rankLogin: "ログインで記録",
    myRank: "自分の順位",
  },
  zh: {
    chip: "圣地巡礼地图",
    h1Lead: "动漫",
    h1Accent: "圣地巡礼",
    h1Tail: "地图",
    intro:
      "在地图上查看日本各地的动漫圣地和真实取景地，找到你附近的地点，用 Google 地图一键导航。也可以按作品和地区浏览。",
    primaryCta: "查找附近的圣地",
    secondaryCta: "打开地图",
    privacy: "你的位置只在手机上用来计算距离，不会发送到我们的服务器。",
    nearbyTitle: "附近的圣地",
    drawerTitle: "这一带的热门圣地",
    nearbySorted: "按离你最近排序",
    navigate: "导航",
    streetView: "街景",
    details: "详细",
    geoDenied: "无法使用定位，正在打开巡礼地图。",
    walkMinutes: (minutes) => `步行 ${minutes} 分钟`,
    statSpots: "取景地",
    statAnime: "作品",
    statAreas: "地区",
    areasEyebrow: "AREAS",
    areasTitle: "热门圣地巡礼地区",
    areasSubtitle: "旅行目的地附近的圣地，一次看完。",
    areasAll: "地区列表 →",
    animeEyebrow: "SERIES",
    animeTitle: "热门动漫的圣地",
    animeSubtitle: "选一部喜欢的作品，在地图上看它的所有圣地。",
    animeAll: "番剧列表 →",
    spotCount: (count) => `${formatCount("zh", count)} 处取景地`,
    animeMeta: (count, area) =>
      area
        ? `${formatCount("zh", count)} 处取景地 · ${area}`
        : `${formatCount("zh", count)} 处取景地`,
    howEyebrow: "HOW IT WORKS",
    howTitle: "打开地图，直接去圣地",
    howSubtitle: "三步就能用。",
    steps: [
      {
        title: "打开定位",
        body: "只用来计算距离，不会发送到我们的服务器。",
      },
      {
        title: "看看附近的圣地",
        body: "按距离从近到远，列出作品和地点。",
      },
      {
        title: "先用街景看一眼，再一键导航",
        body: "先看看周围长什么样，再用 Google 地图直接过去。",
      },
    ],
    step3Fallback: {
      title: "一键导航出发",
      body: "点「导航」就会打开 Google 地图。",
    },
    gameEyebrow: "MINI GAME",
    gameTitle: "还能玩圣地猜猜看",
    gameBody: "根据动画线索，猜猜这是哪里的圣地。",
    gameBattle: "对战模式",
    gameRank: "排行榜",
    difficultyLabel: "难度",
    roundsLabel: "回合数",
    roundsOption: (rounds) => `${rounds} 回合`,
    difficultyOption: (tier) => DIFFICULTY.zh[tier],
    start: "开始游戏",
    navMap: "圣地地图",
    navAnime: "按作品找",
    navAreas: "按地区找",
    navGame: "圣地猜猜看",
    navRank: "排行榜",
    login: "登录",
    logout: "退出登录",
    accountMenu: "账号菜单",
    editProfile: "编辑资料",
    cancel: "取消",
    profileTitle: "玩家资料",
    username: "用户名",
    country: "地区",
    countryUnset: "未设置",
    saveProfile: "保存资料",
    saving: "保存中...",
    saved: "已保存",
    menu: "菜单",
    closeMenu: "关闭菜单",
    langLabel: "语言",
    searchPill: "按作品和地区找",
    favoritesPill: "想去",
    zoomIn: "放大",
    zoomOut: "缩小",
    locate: "当前位置",
    myLocation: "我的位置",
    mapLabel: "动漫圣地巡礼地图",
    searchWorks: "搜索作品名",
    searchWorksEmpty: "没有找到相关作品",
    searchClear: "清除",
    popularWorks: "从热门作品找",
    showAllWorks: "展开全部",
    popularAll: "全部 ›",
    dismissPopular: "关闭热门作品",
    clearWorkFilter: "清除作品筛选",
    workPage: "作品页面",
    aroundCount: (count) => `这一带 ${formatCount("zh", count)} 处`,
    searchSpotCount: (count) => `${formatCount("zh", count)} 处`,
    footerTagline: "动漫圣地巡礼地图和圣地猜猜看小游戏。",
    footerMap: "MAP",
    footerGame: "GAME",
    footerBrand: "AYIORA",
    footerPrivacy: "隐私政策",
    footerCopy: "© 2026 Ayiora",
    contactGeneral: "合作与提案",
    contactSupport: "问题与故障",
    rankTitle: "排行榜",
    rankBody: "按回合数和难度分别记录最高分。",
    rankEmpty: "还没有上榜成绩",
    rankLoading: "加载中...",
    rankYou: "你",
    rankGuest: "你（未登录）",
    rankLogin: "登录后记录成绩",
    myRank: "我的排名",
  },
  "zh-tw": {
    chip: "動漫聖地巡禮地圖",
    h1Lead: "動漫",
    h1Accent: "聖地巡禮",
    h1Tail: "地圖",
    intro:
      "在地圖上查看日本各地的動漫聖地與真實取景地，找到你附近的地點，用 Google 地圖一鍵導航。也可以依作品和地區瀏覽。",
    primaryCta: "尋找附近的聖地",
    secondaryCta: "打開地圖",
    privacy: "你的位置只會在手機上用來計算距離，不會傳送到我們的伺服器。",
    nearbyTitle: "附近的聖地",
    drawerTitle: "這一帶的熱門聖地",
    nearbySorted: "依離你最近排序",
    navigate: "導航",
    streetView: "街景",
    details: "詳細",
    geoDenied: "無法使用定位，正在打開巡禮地圖。",
    walkMinutes: (minutes) => `步行 ${minutes} 分鐘`,
    statSpots: "取景地",
    statAnime: "作品",
    statAreas: "地區",
    areasEyebrow: "AREAS",
    areasTitle: "熱門聖地巡禮地區",
    areasSubtitle: "旅行目的地附近的聖地，一次看完。",
    areasAll: "地區列表 →",
    animeEyebrow: "SERIES",
    animeTitle: "熱門動漫的聖地",
    animeSubtitle: "選一部喜歡的作品，在地圖上看它的所有聖地。",
    animeAll: "番劇列表 →",
    spotCount: (count) => `${formatCount("zh-tw", count)} 處取景地`,
    animeMeta: (count, area) =>
      area
        ? `${formatCount("zh-tw", count)} 處取景地 · ${area}`
        : `${formatCount("zh-tw", count)} 處取景地`,
    howEyebrow: "HOW IT WORKS",
    howTitle: "打開地圖，直接去聖地",
    howSubtitle: "三步就能用。",
    steps: [
      {
        title: "開啟定位",
        body: "只用來計算距離，不會傳送到我們的伺服器。",
      },
      {
        title: "看看附近的聖地",
        body: "依距離由近到遠，列出作品和地點。",
      },
      {
        title: "先用街景看一眼，再一鍵導航",
        body: "先看看周圍的樣子，再用 Google 地圖直接過去。",
      },
    ],
    step3Fallback: {
      title: "一鍵導航出發",
      body: "點「導航」就會打開 Google 地圖。",
    },
    gameEyebrow: "MINI GAME",
    gameTitle: "還能玩聖地猜猜看",
    gameBody: "根據動畫線索，猜猜這是哪裡的聖地。",
    gameBattle: "對戰模式",
    gameRank: "排行榜",
    difficultyLabel: "難度",
    roundsLabel: "回合數",
    roundsOption: (rounds) => `${rounds} 回合`,
    difficultyOption: (tier) => DIFFICULTY["zh-tw"][tier],
    start: "開始遊戲",
    navMap: "聖地地圖",
    navAnime: "依作品找",
    navAreas: "依地區找",
    navGame: "聖地猜猜看",
    navRank: "排行榜",
    login: "登入",
    logout: "登出",
    accountMenu: "帳號選單",
    editProfile: "編輯資料",
    cancel: "取消",
    profileTitle: "玩家資料",
    username: "使用者名稱",
    country: "地區",
    countryUnset: "未設定",
    saveProfile: "儲存資料",
    saving: "儲存中...",
    saved: "已儲存",
    menu: "選單",
    closeMenu: "關閉選單",
    langLabel: "語言",
    searchPill: "依作品和地區找",
    favoritesPill: "想去",
    zoomIn: "放大",
    zoomOut: "縮小",
    locate: "目前位置",
    myLocation: "我的位置",
    mapLabel: "動漫聖地巡禮地圖",
    searchWorks: "搜尋作品名稱",
    searchWorksEmpty: "找不到相關作品",
    searchClear: "清除",
    popularWorks: "從熱門作品找",
    showAllWorks: "展開全部",
    popularAll: "全部 ›",
    dismissPopular: "關閉熱門作品",
    clearWorkFilter: "清除作品篩選",
    workPage: "作品頁面",
    aroundCount: (count) => `這一帶 ${formatCount("zh-tw", count)} 處`,
    searchSpotCount: (count) => `${formatCount("zh-tw", count)} 處`,
    footerTagline: "動漫聖地巡禮地圖和聖地猜猜看小遊戲。",
    footerMap: "MAP",
    footerGame: "GAME",
    footerBrand: "AYIORA",
    footerPrivacy: "隱私權政策",
    footerCopy: "© 2026 Ayiora",
    contactGeneral: "合作與提案",
    contactSupport: "問題與故障",
    rankTitle: "排行榜",
    rankBody: "依回合數和難度分別記錄最高分。",
    rankEmpty: "還沒有上榜成績",
    rankLoading: "載入中...",
    rankYou: "你",
    rankGuest: "你（未登入）",
    rankLogin: "登入後記錄成績",
    myRank: "我的排名",
  },
  en: {
    chip: "Pilgrimage map",
    h1Lead: "Anime ",
    h1Accent: "Pilgrimage",
    h1Tail: "Map",
    intro:
      "See real-life anime locations across Japan on one map, find the spots near you, and get directions in Google Maps. Browse by series or by area.",
    primaryCta: "Find spots near me",
    secondaryCta: "Open the map",
    privacy:
      "Your location is only used on your phone to work out distances. It's never sent to our servers.",
    nearbyTitle: "Spots near you",
    drawerTitle: "Popular spots in this area",
    nearbySorted: "Closest to you",
    navigate: "Directions",
    streetView: "Street View",
    details: "Details",
    geoDenied: "Location isn't available. Opening the pilgrimage map.",
    walkMinutes: (minutes) => `${minutes} min walk`,
    statSpots: "Spots",
    statAnime: "Series",
    statAreas: "Areas",
    areasEyebrow: "AREAS",
    areasTitle: "Popular anime pilgrimage areas",
    areasSubtitle: "See every spot around where you're headed.",
    areasAll: "See all →",
    animeEyebrow: "SERIES",
    animeTitle: "Real-life locations from popular anime",
    animeSubtitle: "Pick a series and see all its locations on the map.",
    animeAll: "See all →",
    spotCount: (count) => `${formatCount("en", count)} spots`,
    animeMeta: (count, area) =>
      area
        ? `${formatCount("en", count)} spots · ${area}`
        : `${formatCount("en", count)} spots`,
    howEyebrow: "HOW IT WORKS",
    howTitle: "Open the map and go",
    howSubtitle: "Three simple steps.",
    steps: [
      {
        title: "Turn on location",
        body: "Only used to work out distances. Never sent to our servers.",
      },
      {
        title: "See the spots near you",
        body: "Spots are listed by distance, with the series for each.",
      },
      {
        title: "Preview on Street View, then get directions",
        body: "See what the place looks like, then head there with Google Maps.",
      },
    ],
    step3Fallback: {
      title: "Get directions and go",
      body: "Tap Directions to open Google Maps.",
    },
    gameEyebrow: "MINI GAME",
    gameTitle: "Or play the guessing game",
    gameBody: "Use the anime clues to guess where the real spot is.",
    gameBattle: "Battle mode",
    gameRank: "Ranking",
    difficultyLabel: "Difficulty",
    roundsLabel: "Rounds",
    roundsOption: (rounds) => `${rounds} rounds`,
    difficultyOption: (tier) => DIFFICULTY.en[tier],
    start: "Start the game",
    navMap: "Map",
    navAnime: "By title",
    navAreas: "By area",
    navGame: "Guessing game",
    navRank: "Ranking",
    login: "Log in",
    logout: "Log out",
    accountMenu: "Account menu",
    editProfile: "Edit profile",
    cancel: "Cancel",
    profileTitle: "Player profile",
    username: "Username",
    country: "Region",
    countryUnset: "No region",
    saveProfile: "Save profile",
    saving: "Saving...",
    saved: "Saved",
    menu: "Menu",
    closeMenu: "Close menu",
    langLabel: "Language",
    searchPill: "Browse series and areas",
    favoritesPill: "Favorites",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    locate: "Your location",
    myLocation: "My location",
    searchWorks: "Search anime titles",
    searchWorksEmpty: "No matching titles",
    searchClear: "Clear",
    popularWorks: "Start with a popular title",
    showAllWorks: "Show all",
    popularAll: "All ›",
    dismissPopular: "Hide popular titles",
    clearWorkFilter: "Clear title filter",
    workPage: "Work page",
    aroundCount: (count) =>
      `${formatCount("en", count)} ${count === 1 ? "spot" : "spots"} in view`,
    searchSpotCount: (count) =>
      `${formatCount("en", count)} ${count === 1 ? "spot" : "spots"}`,
    mapLabel: "Anime pilgrimage map",
    footerTagline: "An anime pilgrimage map and location guessing game.",
    footerMap: "MAP",
    footerGame: "GAME",
    footerBrand: "AYIORA",
    footerPrivacy: "Privacy Policy",
    footerCopy: "© 2026 Ayiora",
    contactGeneral: "Partnerships",
    contactSupport: "Bug reports",
    rankTitle: "Ranking",
    rankBody: "Best scores for each round count and difficulty.",
    rankEmpty: "No scores yet",
    rankLoading: "Loading...",
    rankYou: "You",
    rankGuest: "You (guest)",
    rankLogin: "Log in to record",
    myRank: "Your rank",
  },
};

export const HOME_SEO: Record<
  HomeLocale,
  { title: string; description: string }
> = {
  ja: {
    title: "アニメ聖地巡礼マップ｜近くの聖地を探す - AniGuessr",
    description: HOME_PAGE_COPY.ja.intro,
  },
  zh: {
    title: "动漫圣地巡礼地图｜查找附近的动画取景地 - AniGuessr",
    description: HOME_PAGE_COPY.zh.intro,
  },
  "zh-tw": {
    title: "動漫聖地巡禮地圖｜尋找附近的動畫取景地 - AniGuessr",
    description: HOME_PAGE_COPY["zh-tw"].intro,
  },
  en: {
    title:
      "Anime Pilgrimage Map: Real-Life Anime Locations Near You | AniGuessr",
    description: HOME_PAGE_COPY.en.intro,
  },
};

export const HOME_LANG_LINKS: Array<{ locale: HomeLocale; label: string }> = [
  { locale: "ja", label: "日本語" },
  { locale: "en", label: "EN" },
  { locale: "zh", label: "简中" },
  { locale: "zh-tw", label: "繁中" },
];

export function getHomePageCopy(locale: HomeLocale): HomePageCopy {
  return HOME_PAGE_COPY[locale];
}

/**
 * Visible homepage H1. English keeps the space between the accent and the tail.
 * CJK titles are concatenated with no extra space.
 */
export function homeHeadingText(locale: HomeLocale): string {
  const copy = HOME_PAGE_COPY[locale];
  if (locale === "en") return `${copy.h1Lead}${copy.h1Accent} ${copy.h1Tail}`;
  return `${copy.h1Lead}${copy.h1Accent}${copy.h1Tail}`;
}

export function homeDifficultyTiers(): readonly AnimeGuessrDifficultyTier[] {
  return ANIME_GUESSR_DIFFICULTY_TIERS;
}

/** Canonical + hreflang for the homepage. Adds zh-TW without dropping ja/zh/en. */
export function homePageMetadata(locale: HomeLocale): Metadata {
  const seo = HOME_SEO[locale];
  const canonical =
    locale === "zh-tw"
      ? "/zh-tw"
      : withAnimeLocale("/", homeSiteLocale(locale));
  const languages = localeAlternates("/");
  const zhTwUrl = absoluteUrl(withPilgrimageLocale("/", "zh-tw"));
  languages["zh-Hant"] = zhTwUrl;
  languages["zh-TW"] = zhTwUrl;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical, languages },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      locale: locale === "zh-tw" ? "zh_TW" : locale,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}
