import { type MetadataRoute } from "next";
import { ANIME_LOCALES } from "~/lib/anime-locale";
import { absoluteUrl } from "~/lib/seo";

const PRIVATE_PREFIXES = ["/battle/", "/profile", "/onboarding"];

/** zh-tw is a homepage locale and is not part of ANIME_LOCALES. */
const ROBOTS_LOCALES = [...ANIME_LOCALES, "zh-tw"] as const;

/** Training / non-search crawlers blocked site-wide; search & answer-engine bots stay on the `*` rule. */
const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
  "GoogleOther",
  "Google-Extended",
  "Applebot-Extended",
] as const;

const SEARCH_AND_ANSWER_CRAWLERS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Applebot",
  "DuckDuckBot",
  "YandexBot",
] as const;

/**
 * 爬虫规则：开放可公开索引的页面，屏蔽接口、个人化与动态对战房间。
 * 对外 URL 带语言前缀，因此同时屏蔽 /en/battle/ 这类路径。
 */
export default function robots(): MetadataRoute.Robots {
  const localizedPrivate = ROBOTS_LOCALES.flatMap((locale) =>
    PRIVATE_PREFIXES.map((prefix) => `/${locale}${prefix}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...PRIVATE_PREFIXES, ...localizedPrivate],
      },
      {
        userAgent: [...AI_TRAINING_CRAWLERS],
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}

export { AI_TRAINING_CRAWLERS, SEARCH_AND_ANSWER_CRAWLERS };
