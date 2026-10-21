/**
 * Query keys that can carry a display name, email, or similar identity.
 * `userId` is an account id and is intentionally kept.
 */
export const POSTHOG_PII_QUERY_PARAMS = [
  "name",
  "email",
  "e-mail",
  "mail",
  "display_name",
  "displayname",
  "username",
  "user_name",
  "user-name",
] as const;

/** Query keys whose values are themselves URLs or paths (`?next=/battle?name=`). */
const NESTED_URL_QUERY_PARAMS = [
  "next",
  "redirect",
  "return",
  "returnto",
  "return_to",
  "return-to",
] as const;

const PII_QUERY_PARAM_SET = new Set<string>(POSTHOG_PII_QUERY_PARAMS);
const NESTED_URL_QUERY_PARAM_SET = new Set<string>(NESTED_URL_QUERY_PARAMS);

function isPiiQueryParam(key: string) {
  return PII_QUERY_PARAM_SET.has(key.toLowerCase());
}

function isNestedUrlQueryParam(key: string) {
  return NESTED_URL_QUERY_PARAM_SET.has(key.toLowerCase());
}

export function isPostHogUrlPropertyKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized === "search" ||
    normalized === "path" ||
    normalized === "next_path" ||
    normalized.endsWith("url") ||
    normalized.endsWith("pathname") ||
    normalized.endsWith("referrer") ||
    normalized.endsWith("referring_domain")
  );
}

function rebuildUrl(url: URL, kind: "absolute" | "path" | "query") {
  if (kind === "query") {
    const search = url.searchParams.toString();
    return `${search ? `?${search}` : ""}${url.hash}`;
  }
  if (kind === "path") {
    return `${url.pathname}${url.search}${url.hash}`;
  }
  return url.toString();
}

function rewriteSearchParams(params: URLSearchParams, depth: number) {
  const keys = [...params.keys()];
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    if (isPiiQueryParam(key)) {
      params.delete(key);
      continue;
    }
    if (!isNestedUrlQueryParam(key)) continue;
    const values = params.getAll(key);
    const cleaned = values.map((value) => sanitizePostHogUrl(value, depth + 1));
    const changed = cleaned.some((value, index) => value !== values[index]);
    if (!changed) continue;
    params.delete(key);
    for (const value of cleaned) params.append(key, value);
  }
}

/** Removes PII query params. Returns the original string when nothing changes. */
export function sanitizePostHogUrl(value: string, depth = 0): string {
  if (depth > 3 || !value?.includes("?")) return value;

  let url: URL;
  let kind: "absolute" | "path" | "query";
  try {
    if (value.startsWith("?")) {
      kind = "query";
      url = new URL(value, "https://aniguessr.local/");
    } else if (value.startsWith("/")) {
      kind = "path";
      url = new URL(value, "https://aniguessr.local");
    } else {
      kind = "absolute";
      url = new URL(value);
    }
  } catch {
    return value;
  }

  const before = url.searchParams.toString();
  rewriteSearchParams(url.searchParams, depth);
  if (url.searchParams.toString() === before) return value;
  return rebuildUrl(url, kind);
}

export function sanitizePostHogProperties<T>(properties: T): T {
  return sanitizeUnknown(properties) as T;
}

function sanitizeUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeUnknown(item));
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" && isPostHogUrlPropertyKey(key)) {
      output[key] = sanitizePostHogUrl(child);
      continue;
    }
    output[key] = sanitizeUnknown(child);
  }
  return output;
}

/**
 * posthog-js `before_send` for the array.js snippet (defaults 2026-05-30).
 * `sanitize_properties` is the older hook and is not used here.
 * The CDN snippet cannot import this module, so the hook is inlined JS that
 * mirrors `sanitizePostHogUrl`.
 */
export function buildPostHogBeforeSendHook() {
  return `function (event) {
    var pii = ${JSON.stringify([...POSTHOG_PII_QUERY_PARAMS])};
    var nested = ${JSON.stringify([...NESTED_URL_QUERY_PARAMS])};
    function isPii(key) { return pii.indexOf(String(key).toLowerCase()) !== -1; }
    function isNested(key) { return nested.indexOf(String(key).toLowerCase()) !== -1; }
    function isUrlKey(key) {
      var normalized = String(key).toLowerCase();
      return normalized === "search" || normalized === "path" || normalized === "next_path" || normalized.endsWith("url") || normalized.endsWith("pathname") || normalized.endsWith("referrer") || normalized.endsWith("referring_domain");
    }
    function rebuild(url, kind) {
      if (kind === "query") {
        var search = url.searchParams.toString();
        return (search ? "?" + search : "") + url.hash;
      }
      if (kind === "path") return url.pathname + url.search + url.hash;
      return url.toString();
    }
    function sanitize(value, depth) {
      if (depth > 3 || typeof value !== "string" || value.indexOf("?") === -1) return value;
      var url;
      var kind;
      try {
        if (value.charAt(0) === "?") {
          kind = "query";
          url = new URL(value, "https://aniguessr.local/");
        } else if (value.charAt(0) === "/") {
          kind = "path";
          url = new URL(value, "https://aniguessr.local");
        } else {
          kind = "absolute";
          url = new URL(value);
        }
      } catch (error) {
        return value;
      }
      var before = url.searchParams.toString();
      var keys = [];
      url.searchParams.forEach(function (_item, key) { keys.push(key); });
      var seen = {};
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (seen[key]) continue;
        seen[key] = true;
        if (isPii(key)) {
          url.searchParams.delete(key);
          continue;
        }
        if (!isNested(key)) continue;
        var values = url.searchParams.getAll(key);
        var cleaned = [];
        var changed = false;
        for (var j = 0; j < values.length; j++) {
          var next = sanitize(values[j], depth + 1);
          if (next !== values[j]) changed = true;
          cleaned.push(next);
        }
        if (!changed) continue;
        url.searchParams.delete(key);
        for (var k = 0; k < cleaned.length; k++) url.searchParams.append(key, cleaned[k]);
      }
      if (url.searchParams.toString() === before) return value;
      return rebuild(url, kind);
    }
    function walk(record) {
      if (!record || typeof record !== "object") return;
      Object.keys(record).forEach(function (key) {
        var child = record[key];
        if (typeof child === "string" && isUrlKey(key)) {
          record[key] = sanitize(child, 0);
          return;
        }
        if (child && typeof child === "object") walk(child);
      });
    }
    if (!event) return event;
    walk(event.properties);
    walk(event.$set);
    walk(event.$set_once);
    return event;
  }`;
}
