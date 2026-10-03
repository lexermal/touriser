import type { StoredTrip, Trip } from "./types";

export const DEMO_ID = "demo";

/** Calendar date (YYYY-MM-DD) of `now` in `timeZone`. */
function todayIn(timeZone: string, now: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekdayOf(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

/**
 * Moves the example trip so its second day is today in the viewer's time zone. That way the
 * live demo always lands in the middle of a trip day instead of "trip finished".
 */
export function shiftTripToToday(trip: Trip, timeZone: string, now = Date.now()): Trip {
  const anchor = trip.days[Math.min(1, trip.days.length - 1)];
  if (!anchor) return trip;
  const offset = Math.round((Date.parse(todayIn(timeZone, now)) - Date.parse(anchor.date)) / 86_400_000);
  return {
    ...trip,
    days: trip.days.map((d) => {
      const date = addDays(d.date, offset);
      return { ...d, date, weekday: weekdayOf(date) };
    }),
  };
}

export function demoStoredTrip(trip: Trip, timeZone: string, now = Date.now()): StoredTrip {
  return {
    id: DEMO_ID,
    timezone: timeZone,
    uploadedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000,
    trip: shiftTripToToday(trip, timeZone, now),
  };
}
