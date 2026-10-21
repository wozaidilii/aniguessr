/**
 * Display-only district drop for homepage work-card subtitles.
 * Area cards, page titles, and URLs keep the stored name.
 * 郡山市 / 蒲郡市 / 郡上市 stay intact because they do not end in 町 or 村.
 */
export function dropDistrictPrefix(name: string): string {
  const text = name.trim();
  if (!text) return "";
  const county = /^(.+?郡)(.+[町村])$/u.exec(text);
  if (county?.[2]) return county[2];
  const comma = text.indexOf(",");
  const head = (comma === -1 ? text : text.slice(0, comma)).trim();
  const tail = comma === -1 ? "" : text.slice(comma);
  const shortened = stripEnDistrict(head);
  if (!shortened || shortened === head) return text;
  return tail ? `${shortened}${tail}` : shortened;
}

/** Drop “-gun”, and drop an “X District” phrase when a town name remains. */
function stripEnDistrict(name: string): string {
  const withoutGun = name
    .replace(/-gun\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const withoutPhrase = withoutGun
    .replace(/\b[\p{Script=Latin}\d.'’-]+\s+District\b/giu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const outsideParens = withoutPhrase.replace(/\([^)]*\)/g, " ").trim();
  if (outsideParens && /[\p{Script=Latin}\d]/u.test(outsideParens)) {
    return withoutPhrase;
  }
  return withoutGun
    .replace(/\s+District\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
