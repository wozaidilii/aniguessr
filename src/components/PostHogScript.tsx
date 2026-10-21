import Script from "next/script";
import {
  buildPostHogSnippet,
  POSTHOG_HOST,
  POSTHOG_PROJECT_TOKEN,
} from "~/lib/posthog-config";

export function PostHogScript() {
  if (!POSTHOG_PROJECT_TOKEN) return null;

  return (
    <Script
      id="posthog-js"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: buildPostHogSnippet(POSTHOG_PROJECT_TOKEN, POSTHOG_HOST),
      }}
    />
  );
}
