import type { Link } from "./types";

/** Split a markdown table row into trimmed cells. Ignores escaped pipes (`\|`). */
export function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}

export function isSeparatorRow(line: string): boolean {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line.trim());
}

const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)\)/g;

export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function extractLinks(text: string): Link[] {
  const out: Link[] = [];
  for (const m of text.matchAll(LINK_RE)) {
    if (isSafeUrl(m[2])) out.push({ label: m[1].trim() || m[2], url: m[2] });
  }
  return out;
}

export function stripLinks(text: string): string {
  return text.replace(LINK_RE, "").replace(/\s{2,}/g, " ").trim();
}

/** Plain text without markdown emphasis, for notification bodies etc. */
export function plain(text: string): string {
  return stripLinks(text).replace(/\*\*|__|\*|_/g, "").trim();
}

export function isEmptyCell(text: string): boolean {
  const t = text.trim();
  return t === "" || t === "?" || t === "—" || t === "-";
}
