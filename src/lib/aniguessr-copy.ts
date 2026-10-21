import type { AnimeLocale } from "~/lib/anime-locale";
import type { GameLocale } from "~/lib/game-locale";

export const COMPANY_SITE_URL = "https://www.ayiora.com";
export const CONTACT_GENERAL_EMAIL = "aniguessr@ayiora.com";
export const CONTACT_SUPPORT_EMAIL = "support@ayiora.com";

export interface HomeCopy {
  navHow: string;
  navRank: string;
  navPilgrimage: string;
  navContact: string;
  navBattle: string;
  login: string;
  logout: string;
  menu: string;
  closeMenu: string;
  eyebrow: string;
  title: string;
  lead: string;
  statArchiveValue: string;
  statArchiveLabel: string;
  statRoundsValue: string;
  statRoundsLabel: string;
  statBattleValue: string;
  statBattleLabel: string;
  playTitle: string;
  playNote: string;
  difficultyLabel: string;
  roundsLabel: string;
  roundsOption: (rounds: number) => string;
  start: string;
  battleTitle: string;
  battleHint: string;
  pilgrimageTitle: string;
  pilgrimageHint: string;
  howEyebrow: string;
  howTitle: string;
  howBody: string;
  steps: Array<{ kicker: string; title: string; body: string }>;
  pilgrimEyebrow: string;
  pilgrimTitle: string;
  pilgrimBody: string;
  pilgrimCta: string;
  rankEyebrow: string;
  rankTitle: string;
  rankBody: string;
  rankEmpty: string;
  rankLoading: string;
  rankYou: string;
  rankGuest: string;
  rankLogin: string;
  points: string;
  myRank: string;
  contactEyebrow: string;
  contactTitle: string;
  contactGeneralTitle: string;
  contactGeneralHint: string;
  contactSupportTitle: string;
  contactSupportHint: string;
  footerBlurb: string;
  footerBack: string;
  footerGame: string;
  footerBrand: string;
  footerPrivacy: string;
  footerCopy: string;
  profileTitle: string;
  username: string;
  country: string;
  countryUnset: string;
  saveProfile: string;
  saving: string;
  saved: string;
}

export const HOME_COPY: Record<AnimeLocale, HomeCopy> = {
  ja: {
    navHow: "遊び方",
    navRank: "ランキング",
    navPilgrimage: "聖地巡礼",
    navContact: "お問い合わせ",
    navBattle: "対戦モード",
    login: "ログイン",
    logout: "ログアウト",
    menu: "メニュー",
    closeMenu: "閉じる",
    eyebrow: "Anime pilgrimage × Street View",
    title: "アニメの一場面から、聖地の場所を当てよう。",
    lead: "現実の街並みを見て、左上のアニメ手がかりから場所を当てよう。",
    statArchiveValue: "20,000+",
    statArchiveLabel: "アニメロケ地アーカイブ",
    statRoundsValue: "5 / 10",
    statRoundsLabel: "ラウンド制",
    statBattleValue: "1v1",
    statBattleLabel: "対戦モード",
    playTitle: "ゲームを始める",
    playNote: "ログインなしで遊べます",
    difficultyLabel: "難易度",
    roundsLabel: "ラウンド数",
    roundsOption: (rounds) => `${rounds} ラウンド`,
    start: "スタート",
    battleTitle: "対戦モード",
    battleHint: "同じ問題で勝負",
    pilgrimageTitle: "聖地巡礼",
    pilgrimageHint: "ロケ地を地図で",
    howEyebrow: "How to play",
    howTitle: "遊び方は、3ステップ。",
    howBody:
      "アニメの一枚から始まり、現実の街並みで答えを見つける推理ゲームです。",
    steps: [
      {
        kicker: "アニメの手がかり",
        title: "手がかりを見る",
        body: "場所名は表示されません。構図や色、街の雰囲気から作品の舞台を推理します。",
      },
      {
        kicker: "ストリートビュー",
        title: "街並みを観察する",
        body: "メイン画面は現実のストリートビュー。看板、地形、空気感がヒントになります。",
      },
      {
        kicker: "地図",
        title: "地図にピンを置く",
        body: "答えだと思う場所にピンを置きます。距離と回答時間でスコアが決まります。",
      },
    ],
    pilgrimEyebrow: "Pilgrimage",
    pilgrimTitle: "2万件以上のロケ地を、地図から巡る。",
    pilgrimBody:
      "ゲームに登場した聖地は、巡礼マップでいつでも見返せます。次の旅の計画にもどうぞ。",
    pilgrimCta: "聖地巡礼マップを開く",
    rankEyebrow: "Leaderboard",
    rankTitle: "ランキング",
    rankBody: "ラウンド数と難易度ごとのベストスコアです。",
    rankEmpty: "まだ記録がありません",
    rankLoading: "読み込み中...",
    rankYou: "あなた",
    rankGuest: "あなた（未ログイン）",
    rankLogin: "ログインで記録",
    points: "点",
    myRank: "自分の順位",
    contactEyebrow: "Contact",
    contactTitle: "お問い合わせ",
    contactGeneralTitle: "提携・ご提案",
    contactGeneralHint: "作品・自治体・観光関連のコラボレーションなど",
    contactSupportTitle: "不具合・バグ報告",
    contactSupportHint: "表示の不具合、障害、問題の誤りなど",
    footerBlurb:
      "AniGuessr by Ayiora。作品・画像の権利は各権利者に帰属します。",
    footerBack: "www.ayiora.com へ",
    footerGame: "Game",
    footerBrand: "Ayiora",
    footerPrivacy: "プライバシーポリシー",
    footerCopy: "© 2026 Ayiora",
    profileTitle: "プレイヤー",
    username: "ユーザー名",
    country: "地域",
    countryUnset: "未設定",
    saveProfile: "保存",
    saving: "保存中...",
    saved: "保存しました",
  },
  zh: {
    navHow: "玩法",
    navRank: "排行榜",
    navPilgrimage: "圣地巡礼",
    navContact: "联系我们",
    navBattle: "对战模式",
    login: "登录",
    logout: "退出登录",
    menu: "菜单",
    closeMenu: "关闭",
    eyebrow: "Anime pilgrimage × Street View",
    title: "从动漫的一个画面，找出圣地在哪里。",
    lead: "看着真实街景，用左上角的动漫线索找出拍摄地。",
    statArchiveValue: "20,000+",
    statArchiveLabel: "动漫取景地档案",
    statRoundsValue: "5 / 10",
    statRoundsLabel: "回合制",
    statBattleValue: "1v1",
    statBattleLabel: "对战模式",
    playTitle: "开始游戏",
    playNote: "不登录也能玩",
    difficultyLabel: "难度",
    roundsLabel: "回合数",
    roundsOption: (rounds) => `${rounds} 回合`,
    start: "开始",
    battleTitle: "对战模式",
    battleHint: "用同一道题比一比",
    pilgrimageTitle: "圣地巡礼",
    pilgrimageHint: "在地图上查看取景地",
    howEyebrow: "How to play",
    howTitle: "三步就能玩。",
    howBody: "从一张动漫画面开始，在真实街景里找出答案。",
    steps: [
      {
        kicker: "动漫线索",
        title: "看线索",
        body: "不显示地点名。根据构图、颜色和街道气氛来推理作品舞台。",
      },
      {
        kicker: "街景",
        title: "观察街景",
        body: "主画面是真实街景。招牌、地形和氛围都是提示。",
      },
      {
        kicker: "地图",
        title: "在地图上放图钉",
        body: "把图钉放在你认为的位置。距离和作答时间决定分数。",
      },
    ],
    pilgrimEyebrow: "Pilgrimage",
    pilgrimTitle: "两万多处取景地，从地图上慢慢看。",
    pilgrimBody:
      "游戏里出现过的圣地，可以随时在巡礼地图里回看，也方便安排下一次出行。",
    pilgrimCta: "打开圣地巡礼地图",
    rankEyebrow: "Leaderboard",
    rankTitle: "排行榜",
    rankBody: "按回合数和难度分别记录最高分。",
    rankEmpty: "还没有上榜成绩",
    rankLoading: "加载中...",
    rankYou: "你",
    rankGuest: "你（未登录）",
    rankLogin: "登录后记录成绩",
    points: "分",
    myRank: "我的排名",
    contactEyebrow: "Contact",
    contactTitle: "联系我们",
    contactGeneralTitle: "合作与提案",
    contactGeneralHint: "作品、地方和旅游相关的合作",
    contactSupportTitle: "问题与故障",
    contactSupportHint: "显示异常、服务中断、题目错误",
    footerBlurb: "AniGuessr by Ayiora。作品与图像的权利归各权利人所有。",
    footerBack: "前往 www.ayiora.com",
    footerGame: "Game",
    footerBrand: "Ayiora",
    footerPrivacy: "隐私政策",
    footerCopy: "© 2026 Ayiora",
    profileTitle: "玩家资料",
    username: "用户名",
    country: "地区",
    countryUnset: "未设置",
    saveProfile: "保存资料",
    saving: "保存中...",
    saved: "已保存",
  },
  en: {
    navHow: "How to play",
    navRank: "Leaderboard",
    navPilgrimage: "Pilgrimage",
    navContact: "Contact",
    navBattle: "Battle",
    login: "Log in",
    logout: "Log out",
    menu: "Menu",
    closeMenu: "Close",
    eyebrow: "Anime pilgrimage × Street View",
    title: "See one anime frame. Find the real place.",
    lead: "Look at the real street and use the anime clue in the corner to pin the spot.",
    statArchiveValue: "20,000+",
    statArchiveLabel: "Anime location archive",
    statRoundsValue: "5 / 10",
    statRoundsLabel: "Round modes",
    statBattleValue: "1v1",
    statBattleLabel: "Battle mode",
    playTitle: "Start a game",
    playNote: "No login required",
    difficultyLabel: "Difficulty",
    roundsLabel: "Rounds",
    roundsOption: (rounds) => `${rounds} rounds`,
    start: "Start",
    battleTitle: "Battle mode",
    battleHint: "Same questions, head to head",
    pilgrimageTitle: "Pilgrimage",
    pilgrimageHint: "Browse locations on a map",
    howEyebrow: "How to play",
    howTitle: "Three steps.",
    howBody: "Start from one anime frame and find the answer in a real street.",
    steps: [
      {
        kicker: "Anime clue",
        title: "Read the clue",
        body: "Place names stay hidden. Use the framing, color, and street mood to guess the setting.",
      },
      {
        kicker: "Street View",
        title: "Look at the street",
        body: "The main view is a real street. Signs, terrain, and atmosphere are the hints.",
      },
      {
        kicker: "Map",
        title: "Drop a pin",
        body: "Pin the place you think it is. Distance and answer time set the score.",
      },
    ],
    pilgrimEyebrow: "Pilgrimage",
    pilgrimTitle: "Browse 20,000+ filming spots on the map.",
    pilgrimBody:
      "Places from the game stay on the pilgrimage map, ready for the next trip.",
    pilgrimCta: "Open the pilgrimage map",
    rankEyebrow: "Leaderboard",
    rankTitle: "Leaderboard",
    rankBody: "Best scores for each round count and difficulty.",
    rankEmpty: "No ranked scores yet",
    rankLoading: "Loading...",
    rankYou: "You",
    rankGuest: "You (not logged in)",
    rankLogin: "Log in to record a score",
    points: "pts",
    myRank: "My rank",
    contactEyebrow: "Contact",
    contactTitle: "Contact",
    contactGeneralTitle: "Partnerships",
    contactGeneralHint: "Studios, cities, and tourism collaborations",
    contactSupportTitle: "Bugs and outages",
    contactSupportHint: "Display issues, downtime, and wrong answers",
    footerBlurb:
      "AniGuessr by Ayiora. Artwork and images belong to their respective rights holders.",
    footerBack: "www.ayiora.com",
    footerGame: "Game",
    footerBrand: "Ayiora",
    footerPrivacy: "Privacy Policy",
    footerCopy: "© 2026 Ayiora",
    profileTitle: "Player profile",
    username: "Username",
    country: "Region",
    countryUnset: "No region",
    saveProfile: "Save profile",
    saving: "Saving...",
    saved: "Saved",
  },
};

export interface GameUiCopy {
  hudRound: string;
  hudScore: string;
  hudTime: string;
  clueTag: string;
  clueHidden: string;
  clueMore: string;
  pinHint: string;
  dragHint: string;
  yourGuess: string;
  correctPoint: string;
  shareResult: string;
  quit: string;
  distance: string;
  answerTime: string;
  answerLabel: (name: string) => string;
  totalLabel: (score: string) => string;
  closeness: (distanceKm: number) => string;
  breakdown: (distancePts: number, speedPts: number) => string;
}

export const GAME_UI_COPY: Record<GameLocale, GameUiCopy> = {
  ja: {
    hudRound: "ラウンド",
    hudScore: "スコア",
    hudTime: "経過",
    clueTag: "アニメの手がかり",
    clueHidden: "作品名・場所名は非表示",
    clueMore: "手がかりの文章",
    pinHint: "ピンを置いて決定してください",
    dragHint: "ドラッグで周囲を見渡せます · 矢印で移動",
    yourGuess: "あなたの回答",
    correctPoint: "正解の地点",
    shareResult: "結果をシェア",
    quit: "中断",
    distance: "距離",
    answerTime: "回答時間",
    answerLabel: (name) => `正解：${name}`,
    totalLabel: (score) => `合計 ${score} 点`,
    closeness: (distanceKm) => {
      if (distanceKm < 1) return "かなり近い！";
      if (distanceKm < 15) return "近い！";
      if (distanceKm < 80) return "同じあたり";
      if (distanceKm < 400) return "方向は合っている";
      return "かなり遠い";
    },
    breakdown: (distancePts, speedPts) =>
      `距離 ${distancePts} 点 · 時間 +${speedPts}`,
  },
  zh: {
    hudRound: "回合",
    hudScore: "分数",
    hudTime: "用时",
    clueTag: "动漫线索",
    clueHidden: "不显示作品名和地点名",
    clueMore: "线索文字",
    pinHint: "放好图钉后再确认",
    dragHint: "拖动查看四周 · 方向键移动",
    yourGuess: "你的回答",
    correctPoint: "正确地点",
    shareResult: "分享结果",
    quit: "退出",
    distance: "距离",
    answerTime: "作答时间",
    answerLabel: (name) => `正确答案：${name}`,
    totalLabel: (score) => `合计 ${score} 分`,
    closeness: (distanceKm) => {
      if (distanceKm < 1) return "非常近！";
      if (distanceKm < 15) return "比较近";
      if (distanceKm < 80) return "大致同一区域";
      if (distanceKm < 400) return "方向对了";
      return "还比较远";
    },
    breakdown: (distancePts, speedPts) =>
      `距离分 ${distancePts} · 时间加分 +${speedPts}`,
  },
  en: {
    hudRound: "Round",
    hudScore: "Score",
    hudTime: "Elapsed",
    clueTag: "Anime clue",
    clueHidden: "Title and place name stay hidden",
    clueMore: "Clue text",
    pinHint: "Drop a pin, then confirm",
    dragHint: "Drag to look around · arrows to move",
    yourGuess: "Your guess",
    correctPoint: "Correct spot",
    shareResult: "Share result",
    quit: "Quit",
    distance: "Distance",
    answerTime: "Time",
    answerLabel: (name) => `Answer: ${name}`,
    totalLabel: (score) => `Total ${score}`,
    closeness: (distanceKm) => {
      if (distanceKm < 1) return "Very close!";
      if (distanceKm < 15) return "Close";
      if (distanceKm < 80) return "Same area";
      if (distanceKm < 400) return "Right direction";
      return "Quite far";
    },
    breakdown: (distancePts, speedPts) =>
      `Distance ${distancePts} · time +${speedPts}`,
  },
  "zh-tw": {
    hudRound: "回合",
    hudScore: "分數",
    hudTime: "用時",
    clueTag: "動漫線索",
    clueHidden: "不顯示作品名和地點名",
    clueMore: "線索文字",
    pinHint: "放好圖釘後再確認",
    dragHint: "拖曳查看四周 · 方向鍵移動",
    yourGuess: "你的回答",
    correctPoint: "正確地點",
    shareResult: "分享結果",
    quit: "結束",
    distance: "距離",
    answerTime: "作答時間",
    answerLabel: (name) => `正確答案：${name}`,
    totalLabel: (score) => `合計 ${score} 分`,
    closeness: (distanceKm) => {
      if (distanceKm < 1) return "非常近！";
      if (distanceKm < 15) return "比較近";
      if (distanceKm < 80) return "大致同一區域";
      if (distanceKm < 400) return "方向對了";
      return "還比較遠";
    },
    breakdown: (distancePts, speedPts) =>
      `距離分 ${distancePts} · 時間加分 +${speedPts}`,
  },
};

export const LANG_SHORT: Record<AnimeLocale, string> = {
  ja: "日本語",
  en: "EN",
  zh: "简中",
};

export const LANG_ORDER = ["ja", "en", "zh"] as const;
