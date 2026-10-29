import { pilgrimageLocale } from "~/app/[locale]/pilgrimage/_components/pilgrimage-ui";
import { TravelPlanner } from "~/components/travel/travel-planner";
import { getTravelCopy } from "~/lib/travel/copy";
import { pilgrimagePageMetadata } from "~/lib/seo";
import { getTravelKlookLinks } from "~/server/data/travel-klook";
import "~/styles/travel-planner.css";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: value } = await params;
  const locale = pilgrimageLocale(value);
  const copy = getTravelCopy(locale);
  return pilgrimagePageMetadata(
    locale,
    "/pilgrimage/planner",
    `${copy.nav} | AniGuessr`,
    copy.description,
    true,
  );
}

export default async function TravelPlannerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: value } = await params;
  const locale = pilgrimageLocale(value);
  return (
    <TravelPlanner locale={locale} klookLinks={getTravelKlookLinks(locale)} />
  );
}
