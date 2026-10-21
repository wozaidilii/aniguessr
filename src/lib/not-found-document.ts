import path from "node:path";

/** Prefer the prerender. The assets copy is what Vercel traces into the function. */
export function notFoundDocumentCandidates(
  locale: string,
  cwd = process.cwd(),
): string[] {
  return [
    path.join(cwd, ".next/server/app", locale, "http-404.html"),
    path.join(cwd, "assets/not-found-shell", `${locale}.html`),
  ];
}
