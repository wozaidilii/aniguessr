"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowIcon } from "~/components/brand/ArrowIcon";
import { BrandLockup } from "~/components/brand/BrandLockup";
import { LangSwitch } from "~/components/brand/LangSwitch";
import { useAnimeLocale } from "~/hooks/use-anime-locale";
import { GAME_UI_COPY } from "~/lib/aniguessr-copy";
import {
  difficultyHint,
  difficultyLabel,
  difficultyStars,
} from "~/lib/difficulty-labels";
import { GoogleGuessMap } from "~/app/(site)/game/foreign/_components/GoogleGuessMap";
import { GoogleStreetView } from "~/app/(site)/game/foreign/_components/GoogleStreetView";
import { redactAnswerTerms } from "~/lib/anime-clue-redaction";
import { AnimeDifficultySelector } from "~/components/AnimeDifficultySelector";
import { AnimeRoundCountSelector } from "~/components/AnimeRoundCountSelector";
import {
  ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER,
  ANIME_GUESSR_PLACEHOLDER_IMAGE_URL,
  ANIME_GUESSR_ROUNDS,
  buildAnimeGuessrImageUrl,
  buildGoogleMapsStreetViewUrl,
  fetchAnimeGuessrQuestions,
  filterAnimeGuessrQuestionsByTier,
  getAnimeGuessrDifficultyTierFromSearch,
  getAnimeGuessrQuestionText,
  getAnimeGuessrRoundCountFromSearch,
  getStoredAnimeGuessrDifficultyTier,
  getStoredAnimeGuessrRoundCount,
  pickAnimeGuessrQuestions,
  saveAnimeGuessrDifficultyTier,
  saveAnimeGuessrRoundCount,
  toAnimeStreetViewLocation,
  type AnimeGuessrDifficultyTier,
  type AnimeGuessrQuestion,
  type AnimeGuessrQuestionText,
  type AnimeGuessrRoundCount,
} from "~/lib/anime-guessr";
import {
  DEFAULT_ANIME_LOCALE,
  saveAnimeLocale,
  stripLocalePrefix,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import {
  clearPendingAnimeFinalResult,
  formatAnimeGameCountdown,
  loadPendingAnimeFinalResult,
  savePendingAnimeFinalResult,
  type AnimeRoundResult,
} from "~/lib/anime-guessr-state";
import { DEFAULT_FOREIGN_COUNTRY } from "~/lib/foreign-map";
import { getGoogleGuessMapLabels } from "~/lib/google-guess-map-labels";
import { getGoogleMapsLanguage } from "~/lib/google-maps-language";
import { GOOGLE_MAP_AK } from "~/lib/google-street-view";
import { streetViewUnavailable } from "~/lib/street-view-status-copy";
import {
  haversineDistance,
  locationRoundScore,
  LOCATION_ROUND_SCORE_MAX,
  LOCATION_SOLO_ANIME_BREAKTHROUGH_MAX,
} from "~/lib/scoring";
import { AuthLoading, useEmailSession } from "~/lib/player-session-guard";
import {
  canStartGuestGame,
  getGuestBestScoreForRounds,
  getGuestGamesRemaining,
  loadGuestProgress,
  markGuestGameStarted,
  saveGuestGameResult,
  storeGuestProgress,
  type GuestProgress,
} from "~/lib/guest-progress";
import { capturePostHogEvent, POSTHOG_EVENTS } from "~/lib/posthog";
import { PRODUCT_EVENTS, trackProductEvent } from "~/lib/product-analytics";
import { api } from "~/trpc/react";

type Phase = "playing" | "result" | "final";
type LoadState = "loading" | "ready" | "error";
type AuthPromptReason = "record" | "leaderboard" | "history" | "quota";

type GameCopy = {
  authSync: string;
  authPrompts: Record<AuthPromptReason, { title: string; body: string }>;
  googleContinue: string;
  emailContinue: string;
  guestContinue: string;
  guestMode: string;
  quotaTitle: string;
  quotaBody: string;
  home: string;
  loadingTitle: string;
  loadingBank: string;
  emptyBank: string;
  reload: string;
  restored: string;
  notEnoughQuestions: (found: number, total: number, pool: number) => string;
  bankLoadFailed: string;
  noGoogleKey: string;
  noStreetViewQuestions: string;
  skippedStreetView: string;
  imageUnavailable: string;
  imageMissingBase: string;
  guestRemaining: (remaining: number, bestScore: number) => string;
  guestRemainingShort: (remaining: number) => string;
  roundStatus: (round: number, total: number, isResult: boolean) => string;
  totalElapsed: (time: string) => string;
  roundsLabel: string;
  roundsOption: (rounds: number) => string;
  difficultyLabel: string;
  difficultyOption: (tier: AnimeGuessrDifficultyTier) => string;
  difficultyHint: (tier: AnimeGuessrDifficultyTier) => string;
  animeClue: string;
  scene: string;
  openMap: string;
  mapGuessTitle: string;
  closePanel: string;
  guessSelected: string;
  answer: string;
  roundScore: string;
  distancePts: string;
  speedBonus: string;
  elapsed: string;
  guessDistance: (distance: string) => string;
  streetViewLink: string;
  finalScore: string;
  nextRound: string;
  submitGuess: string;
  shareScore: string;
  leaderboard: string;
  saveHistory: string;
  playAgain: string;
  leaderboardSaved: string;
  historySaved: string;
  shareOpened: string;
  shareCopied: string;
  shareFailed: string;
  shareTitle: string;
  shareText: (score: string, url: string) => string;
  roundLabel: (round: number) => string;
  resultLine: (location: string, distance: string, elapsed: string) => string;
  scoreUnit: string;
  scoreBreakthrough: string;
  scoreBreakthroughFinal: string;
  ranks: {
    s: string;
    a: string;
    b: string;
    c: string;
    d: string;
  };
};

const GAME_COPY: Record<AnimeLocale, GameCopy> = {
  zh: {
    authSync: "账号同步",
    authPrompts: {
      record: {
        title: "保存这次新纪录",
        body: "登录后可以把本地新纪录保存到账号，后续换设备也能继续追踪成绩。",
      },
      leaderboard: {
        title: "登录查看排行榜",
        body: "排行榜需要账号成绩，登录后会把本局分数写入你的成绩记录。",
      },
      history: {
        title: "保存历史成绩",
        body: "游客成绩只保存在当前浏览器。登录后可以长期保存每局记录。",
      },
      quota: {
        title: "今日游客局数已用完",
        body: "游客每天可以免费玩 3 局。登录后可以继续保存成绩并跨设备查看记录。",
      },
    },
    googleContinue: "使用 Google 继续",
    emailContinue: "使用邮箱登录 / 注册",
    guestContinue: "继续游客模式",
    guestMode: "游客模式",
    quotaTitle: "今日免费局数已用完",
    quotaBody:
      "未登录每天可以免费玩 3 局，并保存在当前浏览器。登录后可以继续保存成绩和历史记录。",
    home: "返回主页",
    loadingTitle: "猜动漫模式",
    loadingBank: "正在加载动漫巡礼题库...",
    emptyBank: "动漫题库为空，请重新生成题库。",
    reload: "重新加载",
    restored: "登录成功，已回到刚才的成绩页。",
    notEnoughQuestions: (found, total, pool) =>
      `当前难度下只找到 ${found} / ${total} 道可用题（可选池 ${pool} 道），请提高难度档位或重新加载。`,
    bankLoadFailed: "动漫题库加载失败",
    noGoogleKey: streetViewUnavailable("zh"),
    noStreetViewQuestions: "当前没有可用的 Google 街景题目，请重新加载题库。",
    skippedStreetView:
      "上一道动漫巡礼题的现实街景加载失败，已跳过并切换到下一题。",
    imageUnavailable: "题目图片暂不可用，已显示占位图",
    imageMissingBase: "图片前缀未配置，已显示占位图",
    guestRemaining: (remaining, bestScore) =>
      `游客今日剩余 ${remaining} 局 · 本模式本地最高 ${bestScore.toLocaleString()} 分`,
    guestRemainingShort: (remaining) => `游客 · 今日剩余 ${remaining} 局`,
    roundStatus: (round, total, isResult) =>
      `第 ${round} / ${total} 轮${isResult ? "结果" : ""}`,
    totalElapsed: (time) => `总用时 ${time}`,
    roundsLabel: "局数",
    roundsOption: (rounds) => `${rounds} 轮`,
    difficultyLabel: "难度",
    difficultyOption: (tier) => difficultyLabel("zh", tier),
    difficultyHint: (tier) => difficultyHint("zh", tier),
    animeClue: "动漫线索",
    scene: "场景",
    openMap: "打开地图",
    mapGuessTitle: "选择你猜测的位置",
    closePanel: "关闭",
    guessSelected: "已选地点",
    answer: "答案",
    roundScore: "本轮得分",
    distancePts: "距离分",
    speedBonus: "速度补偿",
    elapsed: "用时",
    guessDistance: (distance) => `你的猜测距离实际地点 ${distance}。`,
    streetViewLink: "在街景中查看",
    finalScore: "查看最终得分",
    nextRound: "下一轮",
    submitGuess: "提交猜测",
    shareScore: "分享成绩",
    leaderboard: "查看排行榜",
    saveHistory: "保存历史成绩",
    playAgain: "再来一局",
    leaderboardSaved: "排行榜已更新，正在打开首页。",
    historySaved: "历史成绩已保存到账号。",
    shareOpened: "分享面板已打开。",
    shareCopied: "成绩文案已复制。",
    shareFailed: "分享未完成，可以稍后再试。",
    shareTitle: "AniGuessr 成绩",
    shareText: (score, url) =>
      `我在 AniGuessr 猜动漫模式拿到 ${score} 分，你也来试试：${url}`,
    roundLabel: (round) => `第 ${round} 轮`,
    resultLine: (location, distance, elapsed) =>
      `${location} · 偏差 ${distance} · 用时 ${elapsed}`,
    scoreUnit: "分",
    scoreBreakthrough: "精确度与用时都超乎寻常，本轮得分突破了常规满分上限。",
    scoreBreakthroughFinal: "本局有轮次突破了单轮满分上限。",
    ranks: {
      s: "圣地巡礼大师",
      a: "取景地猎手",
      b: "动漫地理通",
      c: "巡礼新手",
      d: "迷路中",
    },
  },
  ja: {
    authSync: "アカウント同期",
    authPrompts: {
      record: {
        title: "新記録を保存",
        body: "ログインすると、この記録をアカウントに保存して別の端末でも確認できます。",
      },
      leaderboard: {
        title: "ランキングを見る",
        body: "ランキングにはアカウントの成績が必要です。ログイン後、このスコアを保存します。",
      },
      history: {
        title: "プレイ履歴を保存",
        body: "ゲスト成績はこのブラウザだけに保存されます。ログインすると長期保存できます。",
      },
      quota: {
        title: "本日のゲスト回数が終了",
        body: "ゲストは1日3回まで無料で遊べます。ログインすると成績を保存して続けられます。",
      },
    },
    googleContinue: "Google で続ける",
    emailContinue: "メールでログイン / 登録",
    guestContinue: "ゲストのまま続ける",
    guestMode: "ゲストモード",
    quotaTitle: "本日の無料プレイは終了しました",
    quotaBody:
      "未ログインでは1日3回まで無料で遊べます。記録はこのブラウザに保存されます。ログインすると成績と履歴を保存できます。",
    home: "ホームへ戻る",
    loadingTitle: "アニメモード",
    loadingBank: "アニメ聖地の問題を読み込み中...",
    emptyBank: "問題データが空です。問題データを再生成してください。",
    reload: "再読み込み",
    restored: "ログインしました。直前の結果画面に戻りました。",
    notEnoughQuestions: (found, total, pool) =>
      `現在の難易度では ${found} / ${total} 問しか選べません（候補 ${pool} 問）。難易度を上げるか再読み込みしてください。`,
    bankLoadFailed: "問題データの読み込みに失敗しました",
    noGoogleKey: streetViewUnavailable("ja"),
    noStreetViewQuestions:
      "利用可能な Google ストリートビュー問題がありません。問題データを再読み込みしてください。",
    skippedStreetView:
      "前の問題のストリートビューを読み込めなかったため、次の問題に切り替えました。",
    imageUnavailable: "問題画像を表示できないため、仮画像を表示しています",
    imageMissingBase: "画像公開 URL が未設定のため、仮画像を表示しています",
    guestRemaining: (remaining, bestScore) =>
      `ゲスト残り ${remaining} 回 · このモード最高 ${bestScore.toLocaleString()} 点`,
    guestRemainingShort: (remaining) => `ゲスト · 本日残り ${remaining} 回`,
    roundStatus: (round, total, isResult) =>
      `${round} / ${total} ラウンド${isResult ? "結果" : ""}`,
    totalElapsed: (time) => `合計 ${time}`,
    roundsLabel: "ラウンド数",
    roundsOption: (rounds) => `${rounds} ラウンド`,
    difficultyLabel: "難易度",
    difficultyOption: (tier) => difficultyLabel("ja", tier),
    difficultyHint: (tier) => difficultyHint("ja", tier),
    animeClue: "アニメヒント",
    scene: "シーン",
    openMap: "地図を開く",
    mapGuessTitle: "予想地点を選ぶ",
    closePanel: "閉じる",
    guessSelected: "地点を選択済み",
    answer: "答え",
    roundScore: "ラウンド得点",
    distancePts: "距離点",
    speedBonus: "速度ボーナス",
    elapsed: "所要時間",
    guessDistance: (distance) =>
      `予想地点は正解から ${distance} 離れています。`,
    streetViewLink: "ストリートビューで見る",
    finalScore: "最終スコアを見る",
    nextRound: "次のラウンド",
    submitGuess: "予想を送信",
    shareScore: "成績を共有",
    leaderboard: "ランキングを見る",
    saveHistory: "履歴を保存",
    playAgain: "もう一度遊ぶ",
    leaderboardSaved: "ランキングを更新しました。ホームを開きます。",
    historySaved: "履歴をアカウントに保存しました。",
    shareOpened: "共有パネルを開きました。",
    shareCopied: "成績テキストをコピーしました。",
    shareFailed: "共有できませんでした。後でもう一度お試しください。",
    shareTitle: "AniGuessr 成績",
    shareText: (score, url) =>
      `AniGuessr のアニメモードで ${score} 点を取りました。挑戦はこちら：${url}`,
    roundLabel: (round) => `ラウンド ${round}`,
    resultLine: (location, distance, elapsed) =>
      `${location} · 誤差 ${distance} · ${elapsed}`,
    scoreUnit: "点",
    scoreBreakthrough:
      "精度とスピードが際立っているため、このラウンドは通常上限を超えて得点しました。",
    scoreBreakthroughFinal:
      "この対局では満点上限を超えたラウンドがありました。",
    ranks: {
      s: "聖地巡礼マスター",
      a: "ロケ地ハンター",
      b: "アニメ地理通",
      c: "巡礼ビギナー",
      d: "迷子",
    },
  },
  en: {
    authSync: "Account sync",
    authPrompts: {
      record: {
        title: "Save this new record",
        body: "Log in to save this local record to your account and keep tracking it across devices.",
      },
      leaderboard: {
        title: "Log in for leaderboards",
        body: "Leaderboards use account scores. Log in to attach this run to your results.",
      },
      history: {
        title: "Save match history",
        body: "Guest scores only live in this browser. Log in to keep every run long term.",
      },
      quota: {
        title: "Guest plays used today",
        body: "Guests can play 3 free runs per day. Log in to continue and save scores.",
      },
    },
    googleContinue: "Continue with Google",
    emailContinue: "Use email login / sign up",
    guestContinue: "Keep playing as guest",
    guestMode: "Guest mode",
    quotaTitle: "No free guest runs left today",
    quotaBody:
      "Guests can play 3 free runs per day, saved in this browser. Log in to keep playing and save your history.",
    home: "Back home",
    loadingTitle: "Anime Guessr",
    loadingBank: "Loading anime pilgrimage questions...",
    emptyBank:
      "The anime question bank is empty. Regenerate the question data.",
    reload: "Reload",
    restored: "Login complete. You are back on your result page.",
    notEnoughQuestions: (found, total, pool) =>
      `Only ${found} / ${total} questions match this difficulty cap (pool ${pool}). Raise the cap or reload.`,
    bankLoadFailed: "Failed to load anime question data",
    noGoogleKey: streetViewUnavailable("en"),
    noStreetViewQuestions:
      "No Google Street View questions are currently available. Reload the question bank.",
    skippedStreetView:
      "The previous anime pilgrimage question had no available Street View, so it was skipped.",
    imageUnavailable: "Question image unavailable. Showing the placeholder.",
    imageMissingBase:
      "Image public base URL is not configured. Showing the placeholder.",
    guestRemaining: (remaining, bestScore) =>
      `Guest runs left today: ${remaining} · Mode best ${bestScore.toLocaleString()} pts`,
    guestRemainingShort: (remaining) => `Guest · ${remaining} left today`,
    roundStatus: (round, total, isResult) =>
      `Round ${round} / ${total}${isResult ? " result" : ""}`,
    totalElapsed: (time) => `Total ${time}`,
    roundsLabel: "Rounds",
    roundsOption: (rounds) => `${rounds} rounds`,
    difficultyLabel: "Difficulty",
    difficultyOption: (tier) => difficultyLabel("en", tier),
    difficultyHint: (tier) => difficultyHint("en", tier),
    animeClue: "Anime clue",
    scene: "Scene",
    openMap: "Open map",
    mapGuessTitle: "Pick your guess",
    closePanel: "Close",
    guessSelected: "Place selected",
    answer: "Answer",
    roundScore: "Round score",
    distancePts: "Distance",
    speedBonus: "Speed bonus",
    elapsed: "Time",
    guessDistance: (distance) =>
      `Your guess was ${distance} from the real location.`,
    streetViewLink: "View in Street View",
    finalScore: "View final score",
    nextRound: "Next round",
    submitGuess: "Submit guess",
    shareScore: "Share score",
    leaderboard: "View leaderboard",
    saveHistory: "Save history",
    playAgain: "Play again",
    leaderboardSaved: "Leaderboard updated. Opening home.",
    historySaved: "History saved to your account.",
    shareOpened: "Share sheet opened.",
    shareCopied: "Score text copied.",
    shareFailed: "Sharing was not completed. Try again later.",
    shareTitle: "AniGuessr score",
    shareText: (score, url) =>
      `I scored ${score} in AniGuessr anime mode. Try it here: ${url}`,
    roundLabel: (round) => `Round ${round}`,
    resultLine: (location, distance, elapsed) =>
      `${location} · ${distance} away · ${elapsed}`,
    scoreUnit: "pts",
    scoreBreakthrough:
      "Your accuracy and speed were exceptional, so this round scored above the usual cap.",
    scoreBreakthroughFinal:
      "This run included at least one round above the normal per-round cap.",
    ranks: {
      s: "Pilgrimage master",
      a: "Location hunter",
      b: "Anime geographer",
      c: "Pilgrimage rookie",
      d: "Lost traveler",
    },
  },
};

function formatDistance(distanceKm: number, locale: AnimeLocale): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return locale === "zh" ? `${meters} 米` : `${meters} m`;
  }
  const kilometers = Math.round(distanceKm).toLocaleString(
    locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN",
  );
  return locale === "zh" ? `${kilometers} 公里` : `${kilometers} km`;
}

function formatElapsed(seconds: number, locale: AnimeLocale): string {
  const elapsed = Math.max(0, Math.round(seconds));
  if (locale === "en") return `${elapsed}s`;
  return `${elapsed} 秒`;
}

function useElapsedSeconds(active: boolean, resetKey: string) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;

    setElapsed(0);
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, resetKey]);

  return elapsed;
}

function getRank(score: number, locale: AnimeLocale) {
  const ranks = GAME_COPY[locale].ranks;
  if (score >= 450) return { label: ranks.s, symbol: "S" };
  if (score >= 360) return { label: ranks.a, symbol: "A" };
  if (score >= 240) return { label: ranks.b, symbol: "B" };
  if (score >= 120) return { label: ranks.c, symbol: "C" };
  return { label: ranks.d, symbol: "D" };
}

function AuthPromptModal({
  reason,
  locale,
  onClose,
  onBeforeAuth,
}: {
  reason: AuthPromptReason;
  locale: AnimeLocale;
  onClose: () => void;
  onBeforeAuth?: () => void;
}) {
  const copy = GAME_COPY[locale];
  const prompt = copy.authPrompts[reason];
  const next = withAnimeLocale("/game/anime", locale);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <div className="anime-panel w-full max-w-md p-6">
        <div className="anime-chip mb-4 w-fit">{copy.authSync}</div>
        <h2 className="text-2xl font-black text-pink-100">{prompt.title}</h2>
        <p className="mt-3 text-sm leading-6 text-pink-50/70">{prompt.body}</p>

        <div className="mt-6 grid gap-3">
          <Link
            href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
            onClick={onBeforeAuth}
            className="anime-button text-center"
          >
            {copy.googleContinue}
          </Link>
          <Link
            href={withAnimeLocale(
              `/login?next=${encodeURIComponent(next)}`,
              locale,
            )}
            onClick={onBeforeAuth}
            className="anime-button-secondary text-center"
          >
            {copy.emailContinue}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl text-sm font-bold text-cyan-100/70 transition hover:bg-white/10 hover:text-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:outline-none"
          >
            {copy.guestContinue}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnimeClueImage({
  question,
  text,
  imageUnavailable,
  imageMissingBase,
  flush = false,
}: {
  question: AnimeGuessrQuestion;
  text: AnimeGuessrQuestionText;
  imageUnavailable: string;
  imageMissingBase: string;
  flush?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imageUrl = buildAnimeGuessrImageUrl(question.imagePath);
  const showPlaceholder = !imageUrl || failed;
  const displayImageUrl = showPlaceholder
    ? ANIME_GUESSR_PLACEHOLDER_IMAGE_URL
    : imageUrl;

  useEffect(() => {
    setFailed(false);
  }, [question.id]);

  return (
    <div
      className={
        flush
          ? "relative aspect-video overflow-hidden bg-black/40"
          : "relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayImageUrl}
        alt={flush ? "" : text.title}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
      {showPlaceholder && (
        <div className="absolute right-2 bottom-2 left-2 rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1.5 text-[11px] leading-4 text-pink-50/80">
          {imageUrl ? imageUnavailable : imageMissingBase}
        </div>
      )}
    </div>
  );
}

function AnimeCluePanel({
  question,
  text,
  copy,
  locale,
  difficultyTier,
  loadMessage,
}: {
  question: AnimeGuessrQuestion;
  text: AnimeGuessrQuestionText;
  copy: GameCopy;
  locale: AnimeLocale;
  difficultyTier: AnimeGuessrDifficultyTier;
  loadMessage: string;
}) {
  const ui = GAME_UI_COPY[locale];
  const [open, setOpen] = useState(false);
  const description = redactAnswerTerms(text.description, [
    text.location,
    text.answerName,
    question.location,
  ]);
  const aspect = text.aspect
    ? redactAnswerTerms(text.aspect, [
        text.location,
        text.answerName,
        question.location,
      ])
    : "";

  return (
    <aside className="ag-glass ag-clue">
      <div className="relative">
        <AnimeClueImage
          question={question}
          text={text}
          imageUnavailable={copy.imageUnavailable}
          imageMissingBase={copy.imageMissingBase}
          flush
        />
        <span className="ag-clue-tag">{ui.clueTag}</span>
      </div>
      <div className="ag-clue-cap">
        <b>
          {difficultyLabel(locale, difficultyTier)} {difficultyStars(difficultyTier)}
        </b>
        <span>{ui.clueHidden}</span>
        <button type="button" className="ag-clue-more" onClick={() => setOpen((value) => !value)}>
          {ui.clueMore}
        </button>
      </div>
      {open && (
        <div className="ag-clue-text">
          <p>{description}</p>
          {aspect ? (
            <p>
              {copy.scene}: {aspect}
            </p>
          ) : null}
        </div>
      )}
      {loadMessage && <p className="ag-clue-text">{loadMessage}</p>}
    </aside>
  );
}

export default function AnimeGuessrPage() {
  const { ready, session } = useEmailSession();
  const locale = useAnimeLocale();
  const router = useRouter();
  const pathname = usePathname();
  const ui = GAME_UI_COPY[locale];
  const [questions, setQuestions] = useState<AnimeGuessrQuestion[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadMessage, setLoadMessage] = useState(
    GAME_COPY[DEFAULT_ANIME_LOCALE].loadingBank,
  );
  const [guestProgress, setGuestProgress] = useState<GuestProgress | null>(
    null,
  );
  const [authPromptReason, setAuthPromptReason] =
    useState<AuthPromptReason | null>(null);
  const [guestBlocked, setGuestBlocked] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<AnimeRoundResult[]>([]);
  const [roundCount, setRoundCount] =
    useState<AnimeGuessrRoundCount>(ANIME_GUESSR_ROUNDS);
  const [difficultyTier, setDifficultyTier] =
    useState<AnimeGuessrDifficultyTier>(ANIME_GUESSR_DEFAULT_DIFFICULTY_TIER);
  const roundStartedAtRef = useRef(Date.now());
  const recordedStartKeyRef = useRef<string | null>(null);
  const recordedCompletionKeyRef = useRef<string | null>(null);
  const recordGameSessionPromiseRef = useRef<Promise<unknown> | null>(null);
  const recordActivity = api.player.recordActivity.useMutation();
  const recordGameSession = api.player.recordGameSession.useMutation();
  const copy = GAME_COPY[locale];
  const googleMapLabels = getGoogleGuessMapLabels(locale);
  const googleMapsLanguage = getGoogleMapsLanguage(locale);
  const gameNextUrl = useMemo(
    () => withAnimeLocale("/game/anime", locale),
    [locale],
  );
  const homeUrl = useMemo(() => withAnimeLocale("/", locale), [locale]);
  const loginUrl = useMemo(
    () =>
      withAnimeLocale(`/login?next=${encodeURIComponent(gameNextUrl)}`, locale),
    [gameNextUrl, locale],
  );

  const current = questions[round];
  const currentText = useMemo(
    () => (current ? getAnimeGuessrQuestionText(current, locale) : null),
    [current, locale],
  );
  const latestResult = results[results.length - 1];
  const roundResult = phase === "result" ? latestResult : undefined;
  const roundResultText = useMemo(
    () =>
      roundResult
        ? getAnimeGuessrQuestionText(roundResult.question, locale)
        : null,
    [locale, roundResult],
  );
  const mapGuess = roundResult?.guess ?? guess;
  const mapAnswer = useMemo(
    () =>
      roundResult
        ? { lat: roundResult.question.lat, lng: roundResult.question.lng }
        : null,
    [roundResult],
  );
  const totalScore = useMemo(
    () => results.reduce((sum, result) => sum + result.score, 0),
    [results],
  );
  const currentStreetViewLocation = useMemo(
    () => (current ? toAnimeStreetViewLocation(current, locale) : null),
    [current, locale],
  );
  const gameTimerKey = `${reloadKey}:${roundCount}:${difficultyTier}:${questions.map((question) => question.id).join(",")}`;
  const totalElapsedSeconds = useElapsedSeconds(
    loadState === "ready" && phase !== "final" && !guestBlocked,
    gameTimerKey,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const roundsFromSearch = getAnimeGuessrRoundCountFromSearch(
      window.location.search,
    );
    const nextRoundCount = roundsFromSearch ?? getStoredAnimeGuessrRoundCount();
    setRoundCount(nextRoundCount);
    saveAnimeGuessrRoundCount(nextRoundCount);

    const difficultyFromSearch = getAnimeGuessrDifficultyTierFromSearch(
      window.location.search,
    );
    const nextDifficultyTier =
      difficultyFromSearch ?? getStoredAnimeGuessrDifficultyTier();
    setDifficultyTier(nextDifficultyTier);
    saveAnimeGuessrDifficultyTier(nextDifficultyTier);
  }, []);

  const handleRoundCountChange = useCallback(
    (nextRoundCount: AnimeGuessrRoundCount) => {
      if (nextRoundCount === roundCount) return;
      saveAnimeGuessrRoundCount(nextRoundCount);
      setRoundCount(nextRoundCount);
      setReloadKey((value) => value + 1);
    },
    [roundCount],
  );

  const handleDifficultyTierChange = useCallback(
    (nextDifficultyTier: AnimeGuessrDifficultyTier) => {
      if (nextDifficultyTier === difficultyTier) return;
      saveAnimeGuessrDifficultyTier(nextDifficultyTier);
      setDifficultyTier(nextDifficultyTier);
      setReloadKey((value) => value + 1);
    },
    [difficultyTier],
  );

  const canChangeGameSetup =
    loadState !== "ready" || phase === "final" || questions.length === 0;

  const persistPendingFinalResult = useCallback(() => {
    if (phase !== "final") return;
    savePendingAnimeFinalResult({
      questions,
      results,
      gameTimedOut: false,
    });
  }, [phase, questions, results]);

  const restorePendingFinalResult = useCallback(() => {
    const pending = loadPendingAnimeFinalResult();
    if (!pending) return false;

    clearPendingAnimeFinalResult();
    setQuestions(pending.questions);
    setRound(
      Math.max(
        0,
        Math.min(pending.results.length, pending.questions.length - 1),
      ),
    );
    setGuess(null);
    setResults(pending.results);
    setPhase("final");
    setLoadState("ready");
    setLoadMessage("");
    setGuestBlocked(false);
    setAuthPromptReason(null);
    setShareMessage(copy.restored);
    return true;
  }, [copy.restored]);

  const loadQuestions = useCallback(() => {
    let active = true;
    setLoadState("loading");
    setLoadMessage(copy.loadingBank);
    setQuestions([]);
    setRound(0);
    setGuess(null);
    setResults([]);
    setPhase("playing");
    setGuestBlocked(false);
    setShareMessage("");
    roundStartedAtRef.current = Date.now();
    recordedCompletionKeyRef.current = null;

    void fetchAnimeGuessrQuestions()
      .then((pool) => {
        if (!active) return;
        const eligible = filterAnimeGuessrQuestionsByTier(pool, difficultyTier);
        const picked = pickAnimeGuessrQuestions(
          pool,
          roundCount,
          difficultyTier,
        );
        if (picked.length < roundCount) {
          setLoadState("error");
          setLoadMessage(
            copy.notEnoughQuestions(picked.length, roundCount, eligible.length),
          );
          return;
        }
        setQuestions(picked);
        setLoadMessage("");
        setLoadState("ready");
        roundStartedAtRef.current = Date.now();
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadState("error");
        setLoadMessage(
          error instanceof Error ? error.message : copy.bankLoadFailed,
        );
      });

    return () => {
      active = false;
    };
  }, [copy, difficultyTier, roundCount]);

  useEffect(() => {
    if (!ready) return;
    setGuestProgress(loadGuestProgress());
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (session && restorePendingFinalResult()) return;
    return loadQuestions();
  }, [loadQuestions, ready, reloadKey, restorePendingFinalResult, session]);

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    roundStartedAtRef.current = Date.now();
  }, [current, phase]);

  useEffect(() => {
    if (loadState !== "ready" || questions.length === 0) return;
    const key = `${reloadKey}:${questions.map((question) => question.id).join(",")}`;
    if (recordedStartKeyRef.current === key) return;
    recordedStartKeyRef.current = key;

    if (session) {
      recordActivity.mutate({
        token: session.token,
        eventType: "anime_game_started",
        payload: { rounds: questions.length },
        route: "/game/anime",
      });
      capturePostHogEvent(
        POSTHOG_EVENTS.animeGameStarted,
        { rounds: questions.length, auth_state: "logged_in" },
        session.user.id,
      );
      trackProductEvent(PRODUCT_EVENTS.gameStarted, {
        rounds: questions.length,
        auth_state: "logged_in",
      });
      return;
    }

    const progress = loadGuestProgress();
    if (!canStartGuestGame(progress)) {
      setGuestProgress(progress);
      setGuestBlocked(true);
      setAuthPromptReason("quota");
      capturePostHogEvent(POSTHOG_EVENTS.guestQuotaBlocked, {
        games_started_today: progress.startedToday,
      });
      return;
    }

    const nextProgress = markGuestGameStarted(progress);
    storeGuestProgress(nextProgress);
    setGuestProgress(nextProgress);
    capturePostHogEvent(POSTHOG_EVENTS.animeGameStarted, {
      rounds: questions.length,
      auth_state: "guest",
      games_remaining: getGuestGamesRemaining(nextProgress),
    });
    trackProductEvent(PRODUCT_EVENTS.gameStarted, {
      rounds: questions.length,
      auth_state: "guest",
    });
  }, [loadState, questions, recordActivity, reloadKey, session]);

  function handleSubmit() {
    if (!current || !guess || guestBlocked) return;

    const distanceKm = haversineDistance(
      current.lat,
      current.lng,
      guess.lat,
      guess.lng,
    );
    const elapsedSeconds = (Date.now() - roundStartedAtRef.current) / 1000;
    const score = locationRoundScore({
      distanceKm,
      elapsedSeconds,
      soloAnimeScoring: true,
    });
    setResults((prev) => [
      ...prev,
      {
        question: current,
        guess,
        distanceKm,
        distancePts: score.distancePts,
        speedCompensationPts: score.speedCompensationPts,
        elapsedSeconds,
        score: score.total,
        ...(score.scoreBreakthrough ? { scoreBreakthrough: true } : {}),
      },
    ]);
    const roundPayload = {
      round: round + 1,
      questionId: current.id,
      score: score.total,
      distanceKm: Number(distanceKm.toFixed(3)),
      elapsedSeconds: Math.round(elapsedSeconds),
    };
    if (session) {
      recordActivity.mutate({
        token: session.token,
        eventType: "anime_round_submitted",
        payload: roundPayload,
        route: "/game/anime",
      });
    }
    capturePostHogEvent(
      POSTHOG_EVENTS.animeRoundSubmitted,
      {
        ...roundPayload,
        auth_state: session ? "logged_in" : "guest",
      },
      session?.user.id,
    );
    setPhase("result");
  }

  function handleNext() {
    if (round + 1 >= questions.length) {
      setPhase("final");
      return;
    }

    setRound((value) => value + 1);
    setGuess(null);
    setPhase("playing");
  }

  function handleRestart() {
    setReloadKey((value) => value + 1);
  }

  async function handleShareScore() {
    const text = copy.shareText(
      totalScore.toLocaleString(),
      `${window.location.origin}${gameNextUrl}`,
    );
    capturePostHogEvent(
      POSTHOG_EVENTS.animeScoreShared,
      { score: totalScore, auth_state: session ? "logged_in" : "guest" },
      session?.user.id,
    );

    try {
      if (navigator.share) {
        await navigator.share({ title: copy.shareTitle, text });
        setShareMessage(copy.shareOpened);
        return;
      }

      await navigator.clipboard.writeText(text);
      setShareMessage(copy.shareCopied);
    } catch {
      setShareMessage(copy.shareFailed);
    }
  }

  async function handleOpenLeaderboard() {
    if (!session) {
      setAuthPromptReason("leaderboard");
      return;
    }

    try {
      await recordGameSessionPromiseRef.current;
    } catch {
      // Ignore write failures and still open the leaderboard view.
    }

    setShareMessage(copy.leaderboardSaved);
    window.location.href = withAnimeLocale(
      `/?difficulty=${difficultyTier}&rounds=${roundCount}#rank`,
      locale,
    );
  }

  useEffect(() => {
    if (phase !== "final") return;
    const questionKey =
      results.length > 0
        ? results.map((result) => result.question.id).join(",")
        : questions.map((question) => question.id).join(",");
    const key = `${reloadKey}:${roundCount}:${difficultyTier}:${questionKey}:${totalScore}:complete`;
    if (recordedCompletionKeyRef.current === key) return;
    recordedCompletionKeyRef.current = key;

    const maxScore = roundCount * LOCATION_SOLO_ANIME_BREAKTHROUGH_MAX;
    const summary = {
      id: key,
      score: totalScore,
      maxScore,
      rounds: roundCount,
      playedAt: new Date().toISOString(),
    };

    const sessionInput = {
      score: totalScore,
      country: "japan",
      mode: "anime",
      rounds: roundCount,
      difficultyTier,
    } as const;

    if (session) {
      recordActivity.mutate({
        token: session.token,
        eventType: "anime_game_completed",
        payload: {
          rounds: roundCount,
          totalScore,
          totalElapsedSeconds,
          difficultyTier,
        },
        route: "/game/anime",
      });
      recordGameSessionPromiseRef.current = recordGameSession
        .mutateAsync({
          token: session.token,
          ...sessionInput,
        })
        .catch(() => undefined);
      capturePostHogEvent(
        POSTHOG_EVENTS.animeGameCompleted,
        {
          score: totalScore,
          rounds: roundCount,
          total_elapsed_seconds: totalElapsedSeconds,
          auth_state: "logged_in",
          difficulty: difficultyTier,
        },
        session.user.id,
      );
      trackProductEvent(PRODUCT_EVENTS.gameFinished, {
        score: totalScore,
        rounds: roundCount,
        auth_state: "logged_in",
      });
      return;
    }

    const currentProgress = loadGuestProgress();
    const saved = saveGuestGameResult(currentProgress, summary);
    storeGuestProgress(saved.progress);
    setGuestProgress(saved.progress);
    recordGameSessionPromiseRef.current = recordGameSession
      .mutateAsync({
        guestId: saved.progress.guestId,
        ...sessionInput,
      })
      .catch(() => undefined);
    capturePostHogEvent(POSTHOG_EVENTS.animeGameCompleted, {
      score: totalScore,
      rounds: roundCount,
      total_elapsed_seconds: totalElapsedSeconds,
      auth_state: "guest",
      is_new_best: saved.isNewBest,
      difficulty: difficultyTier,
    });
    trackProductEvent(PRODUCT_EVENTS.gameFinished, {
      score: totalScore,
      rounds: roundCount,
      auth_state: "guest",
    });

    if (saved.isNewBest) {
      setAuthPromptReason("record");
    }
  }, [
    phase,
    questions,
    recordActivity,
    recordGameSession,
    reloadKey,
    results,
    roundCount,
    difficultyTier,
    session,
    totalElapsedSeconds,
    totalScore,
  ]);

  const handleCurrentStreetViewUnavailable = useCallback(() => {
    if (!current) return;

    if (!GOOGLE_MAP_AK) {
      setLoadState("error");
      setLoadMessage(copy.noGoogleKey);
      return;
    }

    const nextQuestions = questions.filter(
      (question) => question.id !== current.id,
    );
    setQuestions(nextQuestions);
    setGuess(null);

    if (nextQuestions.length <= results.length) {
      if (results.length > 0) {
        setPhase("final");
        return;
      }

      setLoadState("error");
      setLoadMessage(copy.noStreetViewQuestions);
      return;
    }

    setRound(Math.min(round, nextQuestions.length - 1));
    setPhase("playing");
    setLoadMessage(copy.skippedStreetView);
  }, [copy, current, questions, results.length, round]);

  function selectLocale(nextLocale: AnimeLocale) {
    saveAnimeLocale(nextLocale);
    const innerPath = stripLocalePrefix(pathname);
    const search = window.location.search;
    router.push(withAnimeLocale(`${innerPath}${search}`, nextLocale));
  }

    if (!ready) return <AuthLoading />;

  if (guestBlocked) {
    return (
      <main className="anime-shell grid min-h-screen place-items-center px-5 text-center text-white">
        {authPromptReason && (
          <AuthPromptModal
            reason={authPromptReason}
            locale={locale}
            onClose={() => setAuthPromptReason(null)}
          />
        )}
        <div className="anime-panel w-full max-w-md p-7">
          <div className="anime-chip mx-auto mb-4 w-fit">{copy.guestMode}</div>
          <h1 className="text-3xl font-black text-pink-100">
            {copy.quotaTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-pink-50/70">
            {copy.quotaBody}
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              href={`/api/auth/google/start?next=${encodeURIComponent(gameNextUrl)}`}
              className="anime-button"
            >
              {copy.googleContinue}
            </Link>
            <Link href={loginUrl} className="anime-button-secondary">
              {copy.emailContinue}
            </Link>
            <Link href={homeUrl} className="text-sm font-bold text-cyan-100/70">
              {copy.home}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loadState === "loading") {
    return (
      <main className="anime-shell flex h-screen flex-col items-center justify-center gap-4 text-white">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200/10 text-xl font-black text-cyan-100">
          Ani
        </div>
        <div className="text-xl font-black text-pink-200">
          {copy.loadingTitle}
        </div>
        <p className="text-sm text-pink-50/70">{loadMessage}</p>
      </main>
    );
  }

  if (loadState === "error" || (!current && phase !== "final")) {
    return (
      <main className="anime-shell flex h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
        <p className="max-w-md text-sm leading-6 text-pink-50/70">
          {loadMessage || copy.emptyBank}
        </p>
        <div className="flex max-w-md flex-col gap-4">
          <AnimeDifficultySelector
            value={difficultyTier}
            copy={copy}
            onChange={handleDifficultyTierChange}
          />
          <AnimeRoundCountSelector
            value={roundCount}
            copy={copy}
            onChange={handleRoundCountChange}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="anime-button"
          >
            {copy.reload}
          </button>
          <Link href={homeUrl} className="anime-button-secondary">
            {copy.home}
          </Link>
        </div>
      </main>
    );
  }

  if (phase === "final") {
    const standardMaxScore = roundCount * LOCATION_ROUND_SCORE_MAX;
    const absoluteMaxScore = roundCount * LOCATION_SOLO_ANIME_BREAKTHROUGH_MAX;
    const hasScoreBreakthrough = results.some(
      (result) => result.scoreBreakthrough,
    );
    const rank = getRank(totalScore, locale);
    const guestModeBest = guestProgress
      ? getGuestBestScoreForRounds(guestProgress, roundCount)
      : 0;

    return (
      <main className="anime-shell flex min-h-screen flex-col text-white">
        {authPromptReason && (
          <AuthPromptModal
            reason={authPromptReason}
            locale={locale}
            onClose={() => setAuthPromptReason(null)}
            onBeforeAuth={persistPendingFinalResult}
          />
        )}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
          <BrandLockup href={homeUrl} />
          <Link
            href={homeUrl}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-pink-50 transition hover:bg-white/15 focus:ring-2 focus:ring-cyan-200 focus:outline-none"
          >
            {copy.home}
          </Link>
        </header>

        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <div className="anime-panel mb-6 p-8 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200/10 text-xl font-black text-cyan-100">
              {rank.symbol}
            </div>
            <div className="mb-1 text-2xl font-black text-pink-200">
              {rank.label}
            </div>
            <div className="text-7xl font-extrabold text-white">
              {totalScore.toLocaleString()}
            </div>
            <div className="mt-1 text-pink-50/60">
              / {standardMaxScore.toLocaleString()} {copy.scoreUnit}
              {hasScoreBreakthrough ? (
                <span className="text-cyan-100/70">
                  {" "}
                  (上限 {absoluteMaxScore.toLocaleString()})
                </span>
              ) : null}
            </div>
            {hasScoreBreakthrough ? (
              <div className="mt-4 rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-3 py-2 text-sm leading-6 text-cyan-50">
                {copy.scoreBreakthroughFinal}
              </div>
            ) : null}
            <div className="mt-3 text-sm font-bold text-cyan-100/80">
              {copy.totalElapsed(formatAnimeGameCountdown(totalElapsedSeconds))}
            </div>
            {!session && guestProgress && (
              <div className="mt-4 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-50">
                {copy.guestRemaining(
                  getGuestGamesRemaining(guestProgress),
                  guestModeBest,
                )}
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-col items-center gap-4">
            <AnimeDifficultySelector
              value={difficultyTier}
              disabled={!canChangeGameSetup}
              copy={copy}
              onChange={handleDifficultyTierChange}
            />
            <AnimeRoundCountSelector
              value={roundCount}
              disabled={!canChangeGameSetup}
              copy={copy}
              onChange={handleRoundCountChange}
            />
          </div>

          <div className="space-y-3">
            {results.map((result, index) => {
              const text = getAnimeGuessrQuestionText(result.question, locale);
              return (
                <div
                  key={result.question.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3"
                >
                  <div>
                    <div className="text-sm text-cyan-100/70">
                      {copy.roundLabel(index + 1)}
                    </div>
                    <div className="font-black text-pink-100">
                      {text.animeTitle} · {text.title}
                    </div>
                    <div className="text-xs text-pink-50/60">
                      {copy.resultLine(
                        text.location,
                        formatDistance(result.distanceKm, locale),
                        formatElapsed(result.elapsedSeconds, locale),
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xl font-extrabold text-white">
                    {result.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {shareMessage && (
            <div className="mt-6 rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm text-cyan-50">
              {shareMessage}
            </div>
          )}

          <div className="ag-final-pair mt-8">
            <button
              type="button"
              onClick={handleRestart}
              className="anime-button"
            >
              {copy.playAgain}
            </button>
            <button
              type="button"
              onClick={handleShareScore}
              className="anime-button-secondary"
            >
              {copy.shareScore}
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            <button
              type="button"
              onClick={() => void handleOpenLeaderboard()}
              className="anime-button-secondary h-11 w-full whitespace-nowrap"
            >
              {copy.leaderboard}
            </button>
            <button
              type="button"
              onClick={() =>
                session
                  ? setShareMessage(copy.historySaved)
                  : setAuthPromptReason("history")
              }
              className="anime-button-secondary h-11 w-full whitespace-nowrap"
            >
              {copy.saveHistory}
            </button>
            <Link
              href={homeUrl}
              className="anime-button-secondary h-11 w-full whitespace-nowrap"
            >
              {copy.home}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const traditionalResult = pathname.startsWith("/zh-tw");
  const panel = traditionalResult
    ? {
        streetView: "在街景中查看",
        nextRound: "下一回合",
        finalScore: "查看最終得分",
      }
    : {
        streetView: copy.streetViewLink,
        nextRound: copy.nextRound,
        finalScore: copy.finalScore,
      };
  const resultUi = traditionalResult
    ? {
        ...ui,
        distance: "距離",
        answerTime: "作答時間",
        answerLabel: (name: string) => `正確答案：${name}`,
        totalLabel: (score: string) => `合計 ${score} 分`,
        closeness: (distanceKm: number) => {
          if (distanceKm < 1) return "非常近！";
          if (distanceKm < 15) return "比較近";
          if (distanceKm < 80) return "大致同一區域";
          if (distanceKm < 400) return "方向對了";
          return "還比較遠";
        },
        breakdown: (distancePts: number, speedPts: number) =>
          `距離分 ${distancePts} · 時間加分 +${speedPts}`,
      }
    : ui;

  const roundMax = roundResult?.scoreBreakthrough
    ? LOCATION_SOLO_ANIME_BREAKTHROUGH_MAX
    : LOCATION_ROUND_SCORE_MAX;
  const meterWidth = roundResult
    ? Math.min(100, Math.round((roundResult.score / roundMax) * 100))
    : 0;
  const filledDots = roundResult ? results.length : round;

  return (
    <main className={`ag-game ${roundResult ? "is-result" : "is-play"}`}>
      <div className={`ag-street ${roundResult ? "is-dimmed" : ""}`}>
        {currentStreetViewLocation && (
          <GoogleStreetView
            key={currentStreetViewLocation.id}
            location={currentStreetViewLocation}
            locale={locale}
            googleMapsLanguage={googleMapsLanguage}
            onUnavailable={handleCurrentStreetViewUnavailable}
          />
        )}
      </div>

      {!roundResult && (
        <>
          <div className="ag-bar">
            <div className="ag-glass ag-bar-logo">
              <BrandLockup href={homeUrl} />
            </div>
            <div className="ag-glass ag-hud">
              <div>
                <small>{ui.hudRound}</small>
                <b>
                  {round + 1} / {questions.length}
                </b>
                <div className="ag-dots" aria-hidden="true">
                  {questions.map((question, index) => (
                    <i
                      key={question.id}
                      className={
                        index < filledDots
                          ? "is-done"
                          : index === round
                            ? "is-now"
                            : ""
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <small>{ui.hudScore}</small>
                <b>{totalScore.toLocaleString()}</b>
              </div>
              <div className="is-time">
                <small>{ui.hudTime}</small>
                <b>{formatAnimeGameCountdown(totalElapsedSeconds)}</b>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {!session && guestProgress && (
                <span className="ag-guest ag-glass" style={{ display: "inline-flex", alignItems: "center", padding: "0 12px" }}>
                  {copy.guestRemainingShort(getGuestGamesRemaining(guestProgress))}
                </span>
              )}
              <Link href={homeUrl} className="ag-glass ag-icon-btn">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M7 4v12M13 4v12" />
                </svg>
                <span className="ag-quit-label">{ui.quit}</span>
              </Link>
            </div>
          </div>
          {current && currentText && (
            <AnimeCluePanel
              question={current}
              text={currentText}
              copy={copy}
              locale={locale}
              difficultyTier={difficultyTier}
              loadMessage={loadMessage}
            />
          )}
          <div className="ag-glass ag-hint">{ui.dragHint}</div>
        </>
      )}

      {roundResult && roundResultText && (
        <>
          <div className="ag-result-top">
            <BrandLockup href={homeUrl} />
            <LangSwitch locale={locale} onSelect={selectLocale} />
          </div>
          <aside className="ag-result-side">
            <div className="ag-result-body">
            <p className="ag-kicker">
              ROUND {round + 1} / {questions.length}
            </p>
            <h2 style={{ marginTop: 10, fontSize: 24 }}>{resultUi.closeness(roundResult.distanceKm)}</h2>
            <div className="ag-scoreline">
              <b>{roundResult.score.toLocaleString()}</b>
              <span>/ {roundMax.toLocaleString()}</span>
            </div>
            <div className="ag-meter" aria-hidden="true">
              <i style={{ width: `${meterWidth}%` }} />
            </div>
            <div className="ag-kv">
              <div>
                <small>{resultUi.distance}</small>
                <b>{formatDistance(roundResult.distanceKm, locale)}</b>
              </div>
              <div>
                <small>{resultUi.answerTime}</small>
                <b>{formatElapsed(roundResult.elapsedSeconds, locale)}</b>
              </div>
            </div>
            <p className="ag-clue-text" style={{ padding: "10px 0 0" }}>
              {resultUi.breakdown(roundResult.distancePts, roundResult.speedCompensationPts)}
            </p>
            {roundResult.scoreBreakthrough ? (
              <p className="ag-clue-text" style={{ padding: "8px 0 0" }}>
                {copy.scoreBreakthrough}
              </p>
            ) : null}
            <div className="ag-answer">
              <AnimeClueImage
                question={roundResult.question}
                text={roundResultText}
                imageUnavailable={copy.imageUnavailable}
                imageMissingBase={copy.imageMissingBase}
                flush
              />
              <div>
                <b>{resultUi.answerLabel(roundResultText.answerName)}</b>
                <span>
                  {roundResultText.animeTitle} · {roundResultText.location}
                </span>
              </div>
            </div>
            {roundResultText.funfact.length > 0 && (
              <ul className="ag-clue-text">
                {roundResultText.funfact.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            </div>
            <div className="ag-result-actions">
              <button type="button" onClick={handleNext} className="ag-btn ag-btn-pink">
                {round + 1 >= questions.length ? panel.finalScore : panel.nextRound}
              </button>
              <a
                href={buildGoogleMapsStreetViewUrl(roundResult.question)}
                target="_blank"
                rel="noreferrer"
                className="ag-btn ag-btn-line"
              >
                {panel.streetView}
              </a>
            </div>
          </aside>
          <div className="ag-prog">
            {questions.map((question, index) => (
              <i key={question.id} className={index < filledDots ? "is-done" : ""} />
            ))}
            <span>{resultUi.totalLabel(totalScore.toLocaleString())}</span>
          </div>
        </>
      )}

      <div className="ag-glass ag-map-slot">
        <div className="ag-map-canvas">
          <GoogleGuessMap
            country={DEFAULT_FOREIGN_COUNTRY}
            guess={roundResult ? mapGuess : guess}
            answer={roundResult ? mapAnswer : null}
            answerLabel={roundResult ? roundResultText?.answerName : undefined}
            distanceKm={roundResult?.distanceKm}
            disabled={Boolean(roundResult)}
            labels={googleMapLabels}
            googleMapsLanguage={googleMapsLanguage}
            formatDistance={(distanceKm) => formatDistance(distanceKm, locale)}
            minHeightClass="min-h-0 h-full"
            showLegend={false}
            guessColor="#f9a8d4"
            answerColor="#67e8f9"
            lineColor="#fff7fb"
            onGuess={setGuess}
          />
          {roundResult && (
            <div className="ag-legend">
              <span>
                <i style={{ background: "#f9a8d4" }} />
                {ui.yourGuess}
              </span>
              <span>
                <i style={{ background: "#67e8f9" }} />
                {ui.correctPoint}
              </span>
            </div>
          )}
        </div>
        {!roundResult && (
          <>
            <div className="ag-map-note">
              <span>{guess ? copy.guessSelected : ui.pinHint}</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!guess}
              className="ag-btn ag-btn-pink ag-map-go"
            >
              {copy.submitGuess} <ArrowIcon />
            </button>
          </>
        )}
      </div>
    </main>
  );
}
