import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";

import { rootFontClassName } from "~/app/fonts";
import { CampaignAnalytics } from "~/components/CampaignAnalytics";
import { PostHogRouteTracker } from "~/components/PostHogRouteTracker";
import { PostHogScript } from "~/components/PostHogScript";
import { TRPCReactProvider } from "~/trpc/react";

export function RootDocument({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} data-product="aniguessr" className={rootFontClassName}>
      <body>
        <PostHogScript />
        <TRPCReactProvider>
          <PostHogRouteTracker />
          <Suspense fallback={null}>
            <CampaignAnalytics />
          </Suspense>
          {children}
        </TRPCReactProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
