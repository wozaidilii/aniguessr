import { CONTACT_SUPPORT_EMAIL } from "~/lib/aniguessr-copy";
import {
  splitLocalePath,
  withPilgrimageLocale,
  type PilgrimageLocale,
} from "~/lib/pilgrimage-locale";

/** Rights notices use the support inbox. The address is the visible link text. */
export const RIGHTS_EMAIL = CONTACT_SUPPORT_EMAIL;

export const RIGHTS_LOCALES = ["ja", "zh", "zh-tw", "en"] as const;

const LINK_LABEL: Record<PilgrimageLocale, string> = {
  ja: "権利者の方へ",
  zh: "致版权方",
  "zh-tw": "致版權方",
  en: "For rights holders",
};

const BODY: Record<PilgrimageLocale, string> = {
  ja: "本サイトに掲載している画像・情報について、権利をお持ちの方で掲載の停止や修正をご希望の場合は、下記までご連絡ください。対象ページのURLと、権利者であることがわかる情報をお知らせいただければ、確認のうえ速やかに対応いたします。",
  zh: "如果您是本站所载图片或信息的权利人，希望删除或修改相关内容，请联系我们。请附上相关页面网址和能证明您权利的信息，我们确认后会尽快处理。",
  "zh-tw":
    "如果您是本站所載圖片或資訊的權利人，希望刪除或修改相關內容，請與我們聯絡。請附上相關頁面網址和能證明您權利的資訊，我們確認後會盡快處理。",
  en: "If you hold rights to any image or information on this site and would like it removed or corrected, please contact us. Include the page URL and details showing you are the rights holder, and we will review and act promptly.",
};

/** Label immediately before the mailto address. English keeps a trailing space. */
const CONTACT_PREFIX: Record<PilgrimageLocale, string> = {
  ja: "連絡先：",
  zh: "联系邮箱：",
  "zh-tw": "聯絡信箱：",
  en: "Contact: ",
};

export function rightsLinkLabel(locale: PilgrimageLocale): string {
  return LINK_LABEL[locale];
}

export function rightsBody(locale: PilgrimageLocale): string {
  return BODY[locale];
}

export function rightsContactPrefix(locale: PilgrimageLocale): string {
  return CONTACT_PREFIX[locale];
}

export function rightsPath(locale: PilgrimageLocale): string {
  return withPilgrimageLocale("/rights", locale);
}

export function rightsMailto(): string {
  return `mailto:${RIGHTS_EMAIL}`;
}

/** Locale-prefixed /rights URLs stay on the ISR route and must not Set-Cookie. */
export function isLocalePrefixedRightsPath(pathname: string): boolean {
  const { locale, pathname: inner } = splitLocalePath(pathname);
  return locale != null && inner === "/rights";
}
