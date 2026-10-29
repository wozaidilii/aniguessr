import { type Metadata } from "next";
import { type HomeLocale } from "~/lib/home-locale";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { pilgrimagePageMetadata } from "~/lib/seo";
import {
  PRIVACY_POLICY_DESCRIPTIONS,
  PRIVACY_POLICY_MARKDOWN,
  PRIVACY_POLICY_TITLES,
} from "~/lib/privacy-policy-content";

export const PRIVACY_EFFECTIVE_DATE_LABEL = "2026-10-29";

/** zh-TW keeps its own text. If that text is missing, simplified Chinese, then English. */
export function privacyLocaleChain(
  locale: PilgrimageLocale,
): PilgrimageLocale[] {
  if (locale === "zh-tw") return ["zh-tw", "zh", "en"];
  if (locale === "zh" || locale === "ja") return [locale, "en"];
  return ["en"];
}

/** Drop HTML comments, including the locale markers, before any page render. */
export function stripHtmlComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, "");
}

export function pickPrivacySource(
  locale: PilgrimageLocale,
  sources: Partial<Record<PilgrimageLocale, string>>,
): string {
  for (const candidate of privacyLocaleChain(locale)) {
    const text = stripHtmlComments(sources[candidate] ?? "").trim();
    if (text) return `${text}\n`;
  }
  return "";
}

export function privacyMarkdown(locale: HomeLocale): string {
  return pickPrivacySource(locale, PRIVACY_POLICY_MARKDOWN);
}

export function privacyTitle(locale: HomeLocale): string {
  return PRIVACY_POLICY_TITLES[locale];
}

export function privacyPageMetadata(locale: HomeLocale): Metadata {
  return pilgrimagePageMetadata(
    locale,
    "/privacy",
    PRIVACY_POLICY_TITLES[locale],
    PRIVACY_POLICY_DESCRIPTIONS[locale],
    true,
  );
}
