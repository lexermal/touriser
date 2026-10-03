import type { Stop, Trip } from "./types";

const VAGUE_TIMES: Record<string, number> = {
  morning: 8 * 60,
  noon: 12 * 60,
  midday: 12 * 60,
  afternoon: 14 * 60,
  evening: 18 * 60,
  night: 22 * 60,
};

// Times before this (minutes after midnight) that come after other stops of the
// same day belong to the night after the day's date (e.g. "02:25" hotel after a party).
const NEXT_DAY_CUTOFF = 6 * 60;

/** "16:45", "~20:00", "9.30", "morning" → minutes after midnight, or null. */
export function parseClock(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/^~|^ca\.?\s*/, "");
  const m = t.match(/^(\d{1,2})[:.](\d{2})/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const h = t.match(/^(\d{1,2})\s*h$/);
  if (h) return Number(h[1]) * 60;
  return VAGUE_TIMES[t] ?? null;
}

/** "35 min", "~20–30 min", "1h20", "1 h" → minutes (upper bound of a range), or null. */
export function parseDurationMinutes(text: string): number | null {
  const t = text.toLowerCase();
  const hm = t.match(/(\d+)\s*h\s*(\d+)?/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] ?? 0);
  const range = t.match(/([\d\s–-]+)\s*min/);
  if (!range) return null;
  const nums = (range[1].match(/\d+/g) ?? []).map(Number);
  return nums.length ? Math.max(...nums) : null;
}

function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Wall-clock time in `timeZone` → UTC epoch ms. `minutes` may exceed 24h (rolls into next day). */
export function zonedToUtc(isoDate: string, minutes: number, timeZone: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const off1 = tzOffsetMs(guess, timeZone);
  let t = guess - off1;
  // Second pass fixes the guess when a DST switch lies between `guess` and the real instant.
  const off2 = tzOffsetMs(t, timeZone);
  if (off2 !== off1) t = guess - off2;
  return t;
}

export type TimedStop = Stop & { startMs: number | null; endMs: number | null; leaveByMs: number | null };

/** Stops of the trip in navigation order, filtered by the chosen option per day. */
export function visibleStops(trip: Trip, options: Record<number, string | null>): Stop[] {
  return trip.days.flatMap((d) => {
    const chosen = options[d.index] ?? null;
    return d.stops.filter((s) => !s.group || !chosen || s.group === chosen);
  });
}

export function dayOptions(trip: Trip, dayIndex: number): string[] {
  const groups = trip.days[dayIndex]?.stops.map((s) => s.group).filter((g): g is string => !!g) ?? [];
  return [...new Set(groups)];
}

export function timeStops(trip: Trip, stops: Stop[], timeZone: string): TimedStop[] {
  // Minutes after midnight of the stop's day; may exceed 24h for after-midnight stops.
  const startMin = new Map<string, number | null>();
  const lastByDay = new Map<number, number>();
  for (const s of stops) {
    let min = parseClock(s.start);
    const prev = lastByDay.get(s.dayIndex);
    if (min !== null && prev !== undefined && min < NEXT_DAY_CUTOFF && prev >= NEXT_DAY_CUTOFF) min += 24 * 60;
    if (min !== null) lastByDay.set(s.dayIndex, Math.max(prev ?? 0, min));
    startMin.set(s.id, min);
  }
  const toMs = (s: Stop, min: number | null | undefined) =>
    min == null ? null : zonedToUtc(trip.days[s.dayIndex].date, min, timeZone);
  const starts = stops.map((s) => toMs(s, startMin.get(s.id)));

  return stops.map((s, i) => {
    const startMs = starts[i];
    const sMin = startMin.get(s.id);
    let endMs: number | null = null;
    let eMin = parseClock(s.end);
    if (eMin !== null && sMin != null) {
      if (sMin >= 24 * 60) eMin += 24 * 60;
      // An end before the start crosses midnight ("22:00 → 02:00").
      if (eMin < sMin) eMin += 24 * 60;
      endMs = toMs(s, eMin);
    } else if (startMs !== null) {
      // No end: the stop lasts until the next stop that starts later.
      const next = starts.slice(i + 1).find((t) => t !== null && t > startMs);
      endMs = next ?? startMs + 60 * 60 * 1000;
    }
    const travel = parseDurationMinutes(s.travelTime);
    const leaveByMs = startMs !== null && travel !== null ? startMs - travel * 60 * 1000 : null;
    return { ...s, startMs, endMs, leaveByMs };
  });
}

export type NowState =
  | { kind: "before"; index: number }
  | { kind: "now"; index: number }
  | { kind: "next"; index: number }
  | { kind: "after"; index: number };

/** Which stop to show when the app opens at `now`. */
export function findNow(stops: TimedStop[], now: number): NowState {
  if (!stops.length) return { kind: "after", index: 0 };
  let active = -1;
  stops.forEach((s, i) => {
    if (s.startMs !== null && s.endMs !== null && s.startMs <= now && now < s.endMs) {
      // Overlapping stops (unchosen options): prefer the one that started last.
      if (active === -1 || (stops[active].startMs ?? 0) <= s.startMs) active = i;
    }
  });
  if (active !== -1) return { kind: "now", index: active };

  let next = -1;
  stops.forEach((s, i) => {
    if (s.startMs !== null && s.startMs > now && (next === -1 || s.startMs < (stops[next].startMs ?? Infinity))) next = i;
  });
  const firstTimed = stops.findIndex((s) => s.startMs !== null);
  if (next !== -1) return { kind: next === firstTimed ? "before" : "next", index: next };
  return { kind: "after", index: stops.length - 1 };
}

/** 30 min → "30min", 105 min → "1:45h", 120 min → "2h". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 60000);
  if (total < 60) return `${total}min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}:${String(m).padStart(2, "0")}h` : `${h}h`;
}

export function formatCountdown(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ${min % 60} min`;
  return `${Math.round(h / 24)} days`;
}
