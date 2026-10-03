import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoStoredTrip, shiftTripToToday } from "@/lib/demoTrip";
import { parseTrip } from "@/lib/parser";
import { findNow, timeStops, visibleStops } from "@/lib/timeline";

const trip = parseTrip(readFileSync(path.join(import.meta.dirname, "../../public/examples/berlin-trip.md"), "utf8")).trip!;

describe("demo trip", () => {
  it("puts day 2 on today in the viewer's time zone and fixes the weekdays", () => {
    const now = Date.parse("2027-03-10T09:00:00Z"); // Wed 10:00 in Stockholm
    const shifted = shiftTripToToday(trip, "Europe/Stockholm", now);
    expect(shifted.days.map((d) => `${d.weekday} ${d.date}`)).toEqual([
      "Tue 2027-03-09",
      "Wed 2027-03-10",
      "Thu 2027-03-11",
      "Fri 2027-03-12",
      "Sat 2027-03-13",
      "Sun 2027-03-14",
    ]);
  });

  it("lands on a live stop", () => {
    const now = Date.parse("2027-03-10T09:00:00Z");
    const demo = demoStoredTrip(trip, "Europe/Stockholm", now);
    const stops = timeStops(demo.trip, visibleStops(demo.trip, {}), demo.timezone);
    const state = findNow(stops, now);
    expect(state.kind).toBe("now");
    expect(stops[state.index].name).toBe("Brandenburg Gate");
  });
});
