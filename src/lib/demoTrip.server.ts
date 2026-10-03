import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { demoStoredTrip } from "./demoTrip";
import { parseTrip } from "./parser";
import type { StoredTrip, Trip } from "./types";

let parsed: Trip | null = null;

/** The demo is built from the committed example file on each request; it is never stored. */
export function getDemoTrip(timeZone: string): StoredTrip {
  if (!parsed) {
    const md = readFileSync(path.join(process.cwd(), "public", "examples", "berlin-trip.md"), "utf8");
    parsed = parseTrip(md).trip!;
  }
  return demoStoredTrip(parsed, timeZone);
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
