import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseTrip } from "@/lib/parser";
import { findNow, formatDuration, parseClock, parseDurationMinutes, timeStops, visibleStops, zonedToUtc } from "@/lib/timeline";

const trip = parseTrip(readFileSync(path.join(__dirname, "../../public/examples/berlin-trip.md"), "utf8")).trip!;
const TZ = "Europe/Berlin";

function nowAt(iso: string, options: Record<number, string | null> = {}) {
  const stops = timeStops(trip, visibleStops(trip, options), TZ);
  const state = findNow(stops, Date.parse(iso));
  return { kind: state.kind, name: stops[state.index].name };
}

describe("time helpers", () => {
  it("parses clock values", () => {
    expect(parseClock("16:45")).toBe(16 * 60 + 45);
    expect(parseClock("~20:00")).toBe(20 * 60);
    expect(parseClock("morning")).toBe(8 * 60);
    expect(parseClock("")).toBeNull();
    expect(parseClock("?")).toBeNull();
  });

  it("parses travel times", () => {
    expect(parseDurationMinutes("35 min")).toBe(35);
    expect(parseDurationMinutes("~20–30 min")).toBe(30);
    expect(parseDurationMinutes("1h20")).toBe(80);
    expect(parseDurationMinutes("?")).toBeNull();
  });

  it("converts Berlin wall time across the DST switch", () => {
    // Before 25.10.2026 03:00 Berlin is UTC+2, after UTC+1.
    expect(new Date(zonedToUtc("2026-10-24", 23 * 60, TZ)).toISOString()).toBe("2026-10-24T21:00:00.000Z");
    expect(new Date(zonedToUtc("2026-10-25", 8 * 60 + 45, TZ)).toISOString()).toBe("2026-10-25T07:45:00.000Z");
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatDuration(30 * 60000)).toBe("30min");
    expect(formatDuration(105 * 60000)).toBe("1:45h");
    expect(formatDuration(120 * 60000)).toBe("2h");
  });

  it("is computed from start and end, also across midnight", () => {
    const stops = timeStops(trip, visibleStops(trip, {}), TZ);
    const jazz = stops.find((s) => s.name === "A-Trane jazz club")!;
    expect(formatDuration(jazz.endMs! - jazz.startMs!)).toBe("3:30h");
  });
});

describe("findNow on the example trip", () => {
  it("shows the first stop before the trip", () => {
    expect(nowAt("2026-10-01T10:00:00Z")).toEqual({ kind: "before", name: "BER arrival" });
  });

  it("shows the stop you are at", () => {
    // Wed 14:00 Berlin
    expect(nowAt("2026-10-21T12:00:00Z")).toEqual({ kind: "now", name: "Checkpoint Charlie" });
  });

  it("shows the next stop while travelling between stops", () => {
    // Tue 17:30 Berlin: BER arrival ended 17:15, hotel starts 17:55
    expect(nowAt("2026-10-20T15:30:00Z")).toEqual({ kind: "next", name: "Motel One Alexanderplatz — check in" });
  });

  it("handles stops after midnight", () => {
    // Fri 23:30 Berlin → jazz club 21:00–00:30
    expect(nowAt("2026-10-23T21:30:00Z")).toEqual({ kind: "now", name: "A-Trane jazz club" });
    // Sat 03:00 Berlin → hotel (arrived 00:55, stays until the next morning)
    expect(nowAt("2026-10-24T01:00:00Z")).toEqual({ kind: "now", name: "Motel One Alexanderplatz" });
  });

  it("respects the chosen option", () => {
    // Thu 18:30 Berlin: option A = dinner before the show, option B = river cruise
    expect(nowAt("2026-10-22T16:30:00Z", { 2: "Option A — show" }).name).toBe("Dinner near Friedrichstr.");
    expect(nowAt("2026-10-22T16:30:00Z", { 2: "Option B — river cruise" }).name).toBe("Evening Spree dinner cruise");
  });

  it("handles the DST night and the last day", () => {
    // Sun 09:00 Berlin (UTC+1 after the switch) → breakfast + check out
    expect(nowAt("2026-10-25T08:00:00Z")).toEqual({ kind: "now", name: "Breakfast + check out" });
  });

  it("shows the last stop after the trip", () => {
    expect(nowAt("2026-11-01T10:00:00Z")).toEqual({ kind: "after", name: "BER — flight 12:30" });
  });
});
