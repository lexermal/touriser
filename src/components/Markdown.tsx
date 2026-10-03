import { Fragment, type ReactNode } from "react";
import { isSafeUrl, isSeparatorRow, splitRow } from "@/lib/markdown";

// Trip files come from strangers: everything is rendered as React text nodes,
// never as HTML, and only http(s) links become anchors.
const INLINE_RE = /\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(https?:\/\/[^\s)]+)/g;

export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, url, bold, italic, code, bare] = m;
    if (url !== undefined) {
      out.push(
        isSafeUrl(url) ? (
          <a key={k++} href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-orange-500/60 underline-offset-2">
            <Inline text={label || url} />
          </a>
        ) : (
          label
        ),
      );
    } else if (bold !== undefined) out.push(<strong key={k++}><Inline text={bold} /></strong>);
    else if (italic !== undefined) out.push(<em key={k++} className="text-slate-500 dark:text-slate-400"><Inline text={italic} /></em>);
    else if (code !== undefined) out.push(<code key={k++} className="rounded bg-slate-100 px-1 dark:bg-slate-800">{code}</code>);
    else if (bare !== undefined)
      out.push(<a key={k++} href={bare} target="_blank" rel="noopener noreferrer" className="break-all underline">{bare}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      i++;
    } else if (/^#{1,6}\s/.test(t)) {
      blocks.push(<h3 key={i} className="mt-4 text-base font-semibold"><Inline text={t.replace(/^#+\s*/, "")} /></h3>);
      i++;
    } else if (t.startsWith("|") && isSeparatorRow(lines[i + 1] ?? "")) {
      const header = splitRow(t);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      blocks.push(
        <div key={i} className="-mx-4 overflow-x-auto px-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>{header.map((h, j) => <th key={j} className="border-b border-slate-200 py-1 pr-3 font-semibold dark:border-slate-700"><Inline text={h} /></th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="align-top">
                  {r.map((c, j) => <td key={j} className="border-b border-slate-100 py-1.5 pr-3 dark:border-slate-800"><Inline text={c} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (/^[-*]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^[-*]\s+/, ""));
      blocks.push(
        <ul key={i} className="list-disc space-y-1 pl-5">
          {items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
        </ul>,
      );
    } else if (/^---+$/.test(t)) {
      i++;
    } else {
      // Always consume the first line, so a stray "|" line can't stall the loop.
      const para: string[] = [lines[i++].trim().replace(/^>\s?/, "")];
      while (i < lines.length && lines[i].trim() && !/^(#|\||[-*]\s)/.test(lines[i].trim())) para.push(lines[i++].trim().replace(/^>\s?/, ""));
      blocks.push(<p key={i}><Inline text={para.join(" ")} /></p>);
    }
  }
  return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>;
}
