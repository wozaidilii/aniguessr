import { type NextRequest, NextResponse } from "next/server";
import {
  ANIME_LOCALE_COOKIE,
  DEFAULT_ANIME_LOCALE,
  isAnimeLocale,
  parseLocaleFromPathname,
  withAnimeLocale,
  type AnimeLocale,
} from "~/lib/anime-locale";
import { isLocaleHomeOgPath, isLocaleHomePath } from "~/lib/home-cache";
import { shouldBypassLocale } from "~/lib/locale-exempt";
import {
  isLocalePrefixedPilgrimagePath,
  isLocalePrefixedPrivacyPath,
  pilgrimageHubRedirectTarget,
} from "~/lib/pilgrimage-cache";
import { isLocalePrefixedRightsPath } from "~/lib/rights-contact";
import { splitLocalePath } from "~/lib/pilgrimage-locale";
import { pilgrimageRedirectPath } from "~/lib/pilgrimage-redirects";
import { legacyHostRedirectUrl } from "~/lib/site-url";

/** 根据 Cookie 与 Accept-Language 推断首选语言。 */
function pickPreferredLocale(request: NextRequest): AnimeLocale {
  const cookie = request.cookies.get(ANIME_LOCALE_COOKIE)?.value;
  if (isAnimeLocale(cookie)) return cookie;

  const accept = (request.headers.get("accept-language") ?? "").toLowerCase();
  if (accept.includes("zh")) return "zh";
  if (accept.includes("ja")) return "ja";
  return DEFAULT_ANIME_LOCALE;
}

function buildLocalizedUrl(request: NextRequest, locale: AnimeLocale): URL {
  const { pathname: innerPath } = parseLocaleFromPathname(
    request.nextUrl.pathname,
  );
  const url = request.nextUrl.clone();
  const localized = withAnimeLocale(
    `${innerPath}${url.search}${url.hash}`,
    locale,
  );
  const parsed = new URL(localized, request.url);
  url.pathname = parsed.pathname;
  url.search = parsed.search;
  url.hash = parsed.hash;
  return url;
}

/** 把旧版 ?lang= 查询参数永久重定向到路径前缀 URL。 */
function redirectLegacyLangParam(request: NextRequest): NextResponse | null {
  const langParam = request.nextUrl.searchParams.get("lang");
  if (!langParam || !isAnimeLocale(langParam)) return null;

  const url = buildLocalizedUrl(request, langParam);
  url.searchParams.delete("lang");
  return NextResponse.redirect(url, 308);
}

function applyLocaleContext(
  response: NextResponse,
  locale: AnimeLocale,
): NextResponse {
  response.cookies.set(ANIME_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  response.headers.set("x-anime-locale", locale);
  return response;
}

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  return forwarded ?? request.headers.get("host") ?? request.nextUrl.host;
}

/** 旧生产域名 301 到 NEXT_PUBLIC_SITE_URL（默认 https://aniguessr.ayiora.com）。 */
function redirectLegacyHost(request: NextRequest): NextResponse | null {
  const destination = legacyHostRedirectUrl(
    requestHost(request),
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (!destination) return null;
  return NextResponse.redirect(destination, 301);
}

function rewriteStaticSitemap(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  let file = "";
  if (pathname === "/sitemap.xml" || pathname === "/sitemap-index") {
    file = "/sitemaps/index.xml";
  } else {
    const match = /^\/sitemap\/(\d+)\.xml$/u.exec(pathname);
    if (match?.[1]) file = `/sitemaps/${match[1]}.xml`;
  }
  if (!file) return null;
  const url = request.nextUrl.clone();
  url.pathname = file;
  return NextResponse.rewrite(url);
}

export function middleware(request: NextRequest) {
  const hostRedirect = redirectLegacyHost(request);
  if (hostRedirect) return hostRedirect;

  // Static XML from the data build. This does not look at User-Agent.
  const sitemapRewrite = rewriteStaticSitemap(request);
  if (sitemapRewrite) return sitemapRewrite;

  // The hub index is the homepage. Subpaths stay. Do not Set-Cookie.
  const hubTarget = pilgrimageHubRedirectTarget(request.nextUrl.pathname);
  if (hubTarget) {
    const url = request.nextUrl.clone();
    url.pathname = hubTarget;
    return NextResponse.redirect(url, 308);
  }

  // /zh-tw is pilgrimage-only. Do not 307 it onto /en/zh-tw, and do not
  // Set-Cookie: partial Traditional coverage must stay CDN-cacheable.
  const zhTw = splitLocalePath(request.nextUrl.pathname);
  if (zhTw.locale === "zh-tw") {
    if (
      isLocalePrefixedPilgrimagePath(request.nextUrl.pathname) ||
      isLocalePrefixedPrivacyPath(request.nextUrl.pathname)
    ) {
      const seoRedirect = pilgrimageRedirectPath(
        request.nextUrl.pathname,
        "zh-tw",
      );
      if (seoRedirect) {
        const url = request.nextUrl.clone();
        const parsed = new URL(seoRedirect, request.url);
        url.pathname = parsed.pathname;
        url.search = parsed.search;
        url.hash = parsed.hash;
        return NextResponse.redirect(url, 301);
      }
    }
    return NextResponse.next();
  }

  const { locale: pathLocale, pathname: innerPath } = parseLocaleFromPathname(
    request.nextUrl.pathname,
  );
  const seoRedirect = pilgrimageRedirectPath(
    request.nextUrl.pathname,
    pathLocale ?? pickPreferredLocale(request),
  );
  if (seoRedirect) {
    const url = request.nextUrl.clone();
    const parsed = new URL(seoRedirect, request.url);
    url.pathname = parsed.pathname;
    url.search = parsed.search;
    url.hash = parsed.hash;
    return NextResponse.redirect(url, 301);
  }

  if (shouldBypassLocale(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const legacyRedirect = redirectLegacyLangParam(request);
  if (legacyRedirect) return legacyRedirect;

  // Locale is already in the path. Rewriting or Set-Cookie would make Vercel
  // skip the CDN cache for these ISR pages.
  if (
    isLocalePrefixedPilgrimagePath(request.nextUrl.pathname) ||
    isLocalePrefixedPrivacyPath(request.nextUrl.pathname) ||
    isLocalePrefixedRightsPath(request.nextUrl.pathname) ||
    isLocaleHomePath(request.nextUrl.pathname) ||
    isLocaleHomeOgPath(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  // 无语言前缀：重定向到 /{locale}/...
  if (!pathLocale) {
    // Bare /privacy and /rights always land on the default locale. Do not
    // Set-Cookie: the destination pages are cacheable static documents.
    if (innerPath === "/privacy" || innerPath === "/rights") {
      const url = buildLocalizedUrl(request, DEFAULT_ANIME_LOCALE);
      return NextResponse.redirect(url, 308);
    }
    const preferred = pickPreferredLocale(request);
    const url = buildLocalizedUrl(request, preferred);
    return applyLocaleContext(NextResponse.redirect(url, 307), preferred);
  }

  // 有语言前缀：内部 rewrite 到原有路由，浏览器 URL 保持 /{locale}/...
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = innerPath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-anime-locale", pathLocale);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
  return applyLocaleContext(response, pathLocale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
