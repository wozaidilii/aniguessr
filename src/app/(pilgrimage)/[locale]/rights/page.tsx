import { type Metadata } from "next";
import Link from "next/link";
import {
  pilgrimageLocale,
  pilgrimageSiteHref,
} from "~/app/(pilgrimage)/[locale]/pilgrimage/_components/pilgrimage-ui";
import {
  RIGHTS_EMAIL,
  rightsBody,
  rightsContactPrefix,
  rightsLinkLabel,
  rightsMailto,
} from "~/lib/rights-contact";
import { pilgrimagePageMetadata } from "~/lib/seo";

export const revalidate = 86_400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = pilgrimageLocale((await params).locale);
  const title = rightsLinkLabel(locale);
  return pilgrimagePageMetadata(
    locale,
    "/rights",
    title,
    rightsBody(locale),
    true,
  );
}

export default async function RightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = pilgrimageLocale((await params).locale);
  const title = rightsLinkLabel(locale);

  return (
    <main className="anime-shell min-h-screen text-white">
      <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <Link
          href={pilgrimageSiteHref("/", locale)}
          className="text-sm font-bold text-cyan-100/80 hover:text-cyan-50"
        >
          AniGuessr
        </Link>
        <h1 className="mt-8 text-3xl leading-tight font-black">{title}</h1>
        <p className="mt-6 text-base leading-7 text-pink-50/80">
          {rightsBody(locale)}
        </p>
        <p className="mt-6 text-sm leading-6 text-pink-100/75">
          {rightsContactPrefix(locale)}
          <a
            href={rightsMailto()}
            className="underline decoration-white/30 underline-offset-2 hover:text-cyan-100"
          >
            {RIGHTS_EMAIL}
          </a>
        </p>
      </article>
    </main>
  );
}
