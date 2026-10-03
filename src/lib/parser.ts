import type { Day, Link, ParseResult, Section, Stop } from "./types";
import { extractLinks, isEmptyCell, isSeparatorRow, splitRow, stripLinks } from "./markdown";

// "## Tue 20.10 — Arrival → hotel" (dash may be —, – or -; title optional)
const DAY_HEADING_RE = /^([A-Za-zÄÖÜäöüß]{2,})\.?,?\s+(\d{1,2})\.(\d{1,2})\.?(?:\d{2,4})?\s*(?:[—–-]+\s*(.*))?$/;

const COLUMN_ALIASES: Record<string, keyof Stop> = {
  start: "start",
  end: "end",
  category: "category",
  name: "name",
  address: "address",
  link: "links",
  links: "links",
  "important info": "info",
  info: "info",
  notes: "info",
  transport: "transport",
  "travel time": "travelTime",
  "travel details": "travelDetails",
};

// Addresses like "Secret — in the booking confirmation" must not get a made-up Maps link.
const UNKNOWN_ADDRESS_RE = /secret|tba|unknown|exact address|after ticket|via booking/i;

type RawSection = { heading: string; lines: string[] };

function splitSections(lines: string[]): { h1: string; preamble: string[]; sections: RawSection[] } {
  let h1 = "";
  const preamble: string[] = [];
  const sections: RawSection[] = [];
  for (const line of lines) {
    if (!h1 && /^#\s+/.test(line)) {
      h1 = line.replace(/^#\s+/, "").trim();
    } else if (/^##\s+/.test(line)) {
      sections.push({ heading: line.replace(/^##\s+/, "").trim(), lines: [] });
    } else if (sections.length) {
      sections[sections.length - 1].lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  return { h1, preamble, sections };
}

/** Returns the first markdown table in `lines` plus everything before/after it. */
function takeTable(lines: string[]) {
  const startIdx = lines.findIndex((l) => l.trim().startsWith("|"));
  if (startIdx === -1) return null;
  let endIdx = startIdx;
  while (endIdx < lines.length && lines[endIdx].trim().startsWith("|")) endIdx++;
  const tableLines = lines.slice(startIdx, endIdx);
  if (tableLines.length < 2 || !isSeparatorRow(tableLines[1])) return null;
  return {
    header: splitRow(tableLines[0]),
    rows: tableLines.slice(2).map(splitRow),
    before: lines.slice(0, startIdx),
    after: lines.slice(endIdx),
  };
}

function normalizeHeader(h: string) {
  return stripLinks(h).replace(/\*/g, "").trim().toLowerCase();
}

function weekdayKey(s: string) {
  return s.replace(/[^A-Za-zÄÖÜäöüß]/g, "").slice(0, 3).toLowerCase();
}

function parseStop(cells: Record<string, string>, dayIndex: number, n: number, group: string | null): Stop {
  const addressCell = cells.address ?? "";
  const addressLinks = extractLinks(addressCell);
  // Address may be the link text itself ("[Street 1, City](maps url)") or followed by a
  // separate "[🧭 Maps](url)" link (older format); keep the text, drop "Maps" labels.
  const address = addressCell
    .replace(/\[([^\]]*)\]\([^)\s]+\)/g, (_m, label: string) => (/^\W*maps\W*$/i.test(label) ? "" : label))
    .replace(/🧭/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  let mapsUrl = addressLinks.find((l) => /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|maps/i.test(l.url + l.label))?.url ?? null;
  if (!mapsUrl && address && !isEmptyCell(address) && !UNKNOWN_ADDRESS_RE.test(address)) {
    mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=transit`;
  }
  return {
    id: `${dayIndex}-${n}`,
    dayIndex,
    start: cells.start ?? "",
    end: cells.end ?? "",
    category: cells.category ?? "",
    name: cells.name ?? "",
    address,
    mapsUrl,
    links: extractLinks(cells.links ?? ""),
    info: cells.info ?? "",
    transport: cells.transport ?? "",
    travelTime: cells.travelTime ?? "",
    travelDetails: cells.travelDetails ?? "",
    group,
  };
}

function parseDay(
  m: RegExpMatchArray,
  section: RawSection,
  index: number,
  year: number,
  warnings: string[],
): Day | null {
  const [, weekday, dd, mm, title] = m;
  const date = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  const table = takeTable(section.lines);
  if (!table) {
    warnings.push(`"${section.heading}": no table found, day skipped.`);
    return null;
  }
  const colKeys = table.header.map((h) => COLUMN_ALIASES[normalizeHeader(h)] ?? null);
  if (!colKeys.includes("start") || !colKeys.includes("name")) {
    warnings.push(`"${section.heading}": table needs at least a "Start" and a "Name" column, day skipped.`);
    return null;
  }

  const stops: Stop[] = [];
  let group: string | null = null;
  table.rows.forEach((row, r) => {
    const cells: Record<string, string> = {};
    colKeys.forEach((k, i) => {
      if (k) cells[k] = row[i] ?? "";
    });
    if (row.every((c) => c === "")) return;
    const name = (cells.name ?? "").trim();
    const bold = name.match(/^\*\*(.+)\*\*$/);
    if (!cells.start && bold && row.filter((c) => c !== "").length === 1) {
      const label = bold[1].trim();
      // "Both options" / "All" rows end the option block: following stops always show.
      group = /^(both|all)\b/i.test(label) ? null : label;
      return;
    }
    if (row.length !== table.header.length) {
      warnings.push(`"${section.heading}" row ${r + 1}: expected ${table.header.length} columns, got ${row.length}.`);
    }
    if (!name) {
      warnings.push(`"${section.heading}" row ${r + 1}: no name, row skipped.`);
      return;
    }
    stops.push(parseStop(cells, index, stops.length, group));
  });

  const routes: Link[] = [];
  const extra: string[] = [];
  let inRoutes = false;
  for (const line of [...table.before, ...table.after]) {
    const t = line.trim();
    if (/^\*\*[^*]*maps routes?[^*]*\*\*/i.test(t)) {
      inRoutes = true;
      continue;
    }
    if (inRoutes && /^[-*]\s+/.test(t)) {
      routes.push(...extractLinks(t));
      continue;
    }
    if (inRoutes && t === "") continue;
    inRoutes = false;
    extra.push(line);
  }

  return {
    index,
    date,
    weekday,
    title: (title ?? "").trim(),
    stops,
    routes,
    extraMarkdown: extra.join("\n").replace(/^\s*---\s*$/gm, "").trim(),
    meals: [],
    bags: "",
  };
}

/** Attach "Meals overview" table rows and "Bags" bullets (`- **Tue:** …`) to matching days. */
function attachDayNotes(days: Day[], sections: RawSection[]) {
  const byWeekday = new Map(days.map((d) => [weekdayKey(d.weekday), d]));
  for (const s of sections) {
    if (/meal/i.test(s.heading)) {
      const table = takeTable(s.lines);
      if (!table || normalizeHeader(table.header[0]) !== "day") continue;
      for (const row of table.rows) {
        const day = byWeekday.get(weekdayKey(row[0] ?? ""));
        if (!day) continue;
        day.meals = table.header
          .slice(1)
          .map((label, i) => ({ label: stripLinks(label), value: row[i + 1] ?? "" }))
          .filter((m) => !isEmptyCell(m.value));
      }
    }
    if (/bag|luggage/i.test(s.heading)) {
      for (const line of s.lines) {
        const m = line.trim().match(/^[-*]\s+\*\*([^*]+?):?\*\*:?\s*(.*)$/);
        const day = m && byWeekday.get(weekdayKey(m[1]));
        if (day && m) day.bags = m[2].trim();
      }
    }
  }
}

export function parseTrip(markdown: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const { h1, sections } = splitSections(lines);

  if (!h1) errors.push('Missing title. The first line must look like "# Berlin Trip — 20–25 October 2026".');
  const yearMatch = h1.match(/\b(19|20)\d{2}\b/);
  if (h1 && !yearMatch) errors.push('The title needs the year, e.g. "# Berlin Trip — 20–25 October 2026".');
  const year = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();

  const days: Day[] = [];
  const otherSections: RawSection[] = [];
  let basics: { label: string; value: string }[] = [];
  let lastMonth = 0;
  let yearOffset = 0;

  for (const s of sections) {
    const m = s.heading.match(DAY_HEADING_RE);
    if (m) {
      const month = Number(m[3]);
      // Trips across New Year: a month smaller than the previous day's means next year.
      if (month < lastMonth) yearOffset++;
      lastMonth = month;
      const day = parseDay(m, s, days.length, year + yearOffset, warnings);
      if (day) days.push(day);
    } else if (/^basics$/i.test(s.heading)) {
      const table = takeTable(s.lines);
      basics = table?.rows.map((r) => ({ label: r[0] ?? "", value: r[1] ?? "" })) ?? [];
    } else {
      otherSections.push(s);
    }
  }

  if (!days.length) {
    errors.push('No days found. Each day needs a heading like "## Tue 20.10 — Title" followed by the stops table.');
  }
  for (const d of days) {
    if (!d.stops.length) warnings.push(`"${d.weekday} ${d.date}": no stops.`);
  }
  attachDayNotes(days, otherSections);

  if (errors.length) return { trip: null, errors, warnings };

  const sectionsOut: Section[] = otherSections
    .map((s) => ({ title: s.heading, markdown: s.lines.join("\n").replace(/^\s*---\s*$/gm, "").trim() }))
    .filter((s) => s.markdown);

  return {
    trip: { title: h1.split(/\s+[—–]\s+/)[0].trim(), year, basics, days, sections: sectionsOut },
    errors,
    warnings,
  };
}
