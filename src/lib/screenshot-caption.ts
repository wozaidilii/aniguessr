/**
 * Caption under a decorative spot-page screenshot.
 *
 * When the record already names a rights holder or production, the caption is
 * `{work title} © {holder}`. The question payload and SEO index have no such
 * field, so the caption is `© {work title}`. Never invent 製作委員会.
 */
export function screenshotCaption(
  workTitle: string,
  rightsHolder?: string | null,
): string {
  const work = workTitle.trim();
  const holder = rightsHolder?.trim() ?? "";
  if (holder) return work ? `${work} © ${holder}` : `© ${holder}`;
  return work ? `© ${work}` : "";
}
