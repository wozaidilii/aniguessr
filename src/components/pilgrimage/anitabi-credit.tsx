import { type AnimeLocale } from "~/lib/anime-locale";
import { getPilgrimageCopy } from "~/lib/pilgrimage-copy";
import { anitabiSourceUrl, CC_BY_NC_SA_4_URL } from "~/lib/pilgrimage-nav";

const linkClass =
  "underline decoration-white/30 underline-offset-2 hover:text-cyan-100";

export function AnitabiCredit({
  locale,
  sourceUrl,
  className,
}: {
  locale: AnimeLocale;
  sourceUrl?: string | null;
  className?: string;
}) {
  const copy = getPilgrimageCopy(locale);
  const href = anitabiSourceUrl(sourceUrl);
  return (
    <p className={className ?? "text-[11px] leading-4 text-pink-100/55"}>
      {copy.creditLead}{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        anitabi
      </a>
      {" ("}
      <a
        href={CC_BY_NC_SA_4_URL}
        target="_blank"
        rel="license noopener noreferrer"
        className={linkClass}
      >
        CC BY-NC-SA 4.0
      </a>
      {"). "}
      {copy.creditRights}
    </p>
  );
}

function externalLink(label: string, href: string, license = false) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = license ? "license noopener noreferrer" : "noopener noreferrer";
  anchor.textContent = label;
  anchor.style.color = "#cffafe";
  return anchor;
}

/** Popup caption. Uses text nodes so spot names cannot inject markup. */
export function fillAnitabiCredit(
  parent: HTMLElement,
  locale: AnimeLocale,
  sourceUrl?: string | null,
) {
  const copy = getPilgrimageCopy(locale);
  const paragraph = document.createElement("p");
  paragraph.style.margin = "8px 0 0";
  paragraph.style.fontSize = "11px";
  paragraph.style.lineHeight = "1.4";
  paragraph.style.color = "rgba(252, 231, 243, 0.72)";
  paragraph.append(document.createTextNode(`${copy.creditLead} `));
  paragraph.append(externalLink("anitabi", anitabiSourceUrl(sourceUrl)));
  paragraph.append(document.createTextNode(" ("));
  paragraph.append(externalLink("CC BY-NC-SA 4.0", CC_BY_NC_SA_4_URL, true));
  paragraph.append(document.createTextNode(`). ${copy.creditRights}`));
  parent.append(paragraph);
}
