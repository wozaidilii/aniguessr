export type PrivacyBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/u.test(line.trim());
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

/**
 * Parse the policy subset: headings, paragraphs, lists, tables, and rules.
 * Inline marks stay in the text and are rendered separately.
 */
export function parsePrivacyDocument(markdown: string): PrivacyBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: PrivacyBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/u.exec(trimmed);
    if (heading?.[1] && heading[2]) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (
        index < lines.length &&
        (lines[index] ?? "").trim().startsWith("|")
      ) {
        tableLines.push((lines[index] ?? "").trim());
        index += 1;
      }
      const content = tableLines.filter((row) => !isTableSeparator(row));
      const [header, ...rows] = content.map(splitTableRow);
      if (header && header.length > 0) {
        blocks.push({ type: "table", headers: header, rows });
      }
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (
        index < lines.length &&
        (lines[index] ?? "").trim().startsWith("- ")
      ) {
        items.push((lines[index] ?? "").trim().slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/u.test(trimmed)) {
      const items: string[] = [];
      while (
        index < lines.length &&
        /^\d+\.\s+/u.test((lines[index] ?? "").trim())
      ) {
        items.push((lines[index] ?? "").trim().replace(/^\d+\.\s+/u, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const next = (lines[index] ?? "").trim();
      if (
        !next ||
        next.startsWith("#") ||
        next.startsWith("|") ||
        next.startsWith("- ") ||
        next === "---" ||
        /^\d+\.\s+/u.test(next)
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    }
  }

  return blocks;
}

export function privacyPlainText(markdown: string): string {
  return parsePrivacyDocument(markdown)
    .flatMap((block) => {
      if (block.type === "heading" || block.type === "paragraph")
        return [block.text];
      if (block.type === "ul" || block.type === "ol") return block.items;
      if (block.type === "table") {
        return [...block.headers, ...block.rows.flat()];
      }
      return [];
    })
    .join("\n");
}

const INLINE_TOKEN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/gu;

export type PrivacyInline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

export function safePrivacyHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^mailto:[^\s]+$/u.test(href)) return href;
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return null;
  }
  return null;
}

export function parsePrivacyInline(text: string): PrivacyInline[] {
  const nodes: PrivacyInline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      nodes.push({ type: "text", text: text.slice(cursor, start) });
    }
    if (match[1]) {
      nodes.push({ type: "strong", text: match[1] });
    } else if (match[2] && match[3]) {
      const href = safePrivacyHref(match[3]);
      nodes.push(
        href
          ? { type: "link", text: match[2], href }
          : { type: "text", text: match[2] },
      );
    }
    cursor = start + match[0].length;
  }
  if (cursor < text.length) {
    nodes.push({ type: "text", text: text.slice(cursor) });
  }
  return nodes;
}
