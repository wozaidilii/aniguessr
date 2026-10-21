import type { HomeLocale } from "~/lib/home-locale";
import { withPilgrimageLocale } from "~/lib/pilgrimage-locale";

export interface NotFoundCopy {
  title: string;
  body: string;
  home: string;
  works: string;
}

const COPY: Record<HomeLocale, NotFoundCopy> = {
  ja: {
    title: "ページが見つかりません",
    body: "アドレスを確認するか、次のページから探してください。",
    home: "ホームへ戻る",
    works: "作品から探す",
  },
  zh: {
    title: "找不到这个页面",
    body: "请检查地址，或从下面的页面继续。",
    home: "返回首页",
    works: "按番剧浏览",
  },
  "zh-tw": {
    title: "找不到這個頁面",
    body: "請檢查網址，或從下面的頁面繼續。",
    home: "回到首頁",
    works: "按番劇瀏覽",
  },
  en: {
    title: "Page not found",
    body: "Check the address, or continue from one of these pages.",
    home: "Back home",
    works: "Browse by anime",
  },
};

export function notFoundCopy(locale: HomeLocale): NotFoundCopy {
  return COPY[locale];
}

export function notFoundHomeHref(locale: HomeLocale): string {
  return `/${locale}`;
}

export function notFoundWorksHref(locale: HomeLocale): string {
  return withPilgrimageLocale("/pilgrimage/anime", locale);
}
