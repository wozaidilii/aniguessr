import Link from "next/link";
import { type PilgrimageLocale } from "~/lib/pilgrimage-locale";
import { rightsLinkLabel, rightsPath } from "~/lib/rights-contact";

/**
 * Quiet link to /{locale}/rights.
 * Use it in a pilgrimage footer or homepage legal links.
 * Pass className for layout only; color and size come from .rights-contact-link.
 */
export function RightsContactLink({
  locale,
  className,
}: {
  locale: PilgrimageLocale;
  className?: string;
}) {
  return (
    <Link
      href={rightsPath(locale)}
      className={["rights-contact-link", className].filter(Boolean).join(" ")}
    >
      {rightsLinkLabel(locale)}
    </Link>
  );
}
