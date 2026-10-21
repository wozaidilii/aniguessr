import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";

import { soraFontClassName } from "~/app/fonts";
import { NotoFont } from "~/components/site/noto-font";
import { RegisterServiceWorker } from "~/components/RegisterServiceWorker";
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
    <html
      lang={locale}
      data-product="aniguessr"
      className={`${soraFontClassName} site-light`}
    >
      <body>
        <NotoFont />
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
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
