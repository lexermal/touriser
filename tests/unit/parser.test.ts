import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseTrip } from "@/lib/parser";

const example = readFileSync(path.join(__dirname, "../../public/examples/berlin-trip.md"), "utf8");

describe("parseTrip on the example trip", () => {
  const { trip, errors, warnings } = parseTrip(example);

  it("parses without errors or warnings", () => {
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(trip).not.toBeNull();
  });

  it("reads title, year, basics and all six days", () => {
    expect(trip!.title).toBe("Berlin Example Trip");
    expect(trip!.year).toBe(2026);
    expect(trip!.basics[0]).toEqual({ label: "Arrival", value: "Tue 20.10, 16:45 at BER" });
    expect(trip!.days.map((d) => `${d.weekday} ${d.date}`)).toEqual([
      "Tue 2026-10-20",
      "Wed 2026-10-21",
      "Thu 2026-10-22",
      "Fri 2026-10-23",
      "Sat 2026-10-24",
      "Sun 2026-10-25",
    ]);
    expect(trip!.days.map((d) => d.stops.length)).toEqual([5, 10, 10, 9, 7, 2]);
  });

  it("extracts address, Maps link and links", () => {
    const hackesche = trip!.days[0].stops[2];
    expect(hackesche.name).toBe("Hackesche Höfe");
    expect(hackesche.address).toBe("Rosenthaler Str. 40-41, 10178 Berlin");
    expect(hackesche.mapsUrl).toContain("destination=Rosenthaler+Str.+40-41");
    expect(hackesche.links).toEqual([{ label: "Hackesche Höfe", url: "https://www.hackesche-hoefe.com" }]);
    expect(hackesche.transport).toBe("Walk");
  });

  it("does not invent a Maps link for unknown addresses", () => {
    const dinner = trip!.days[4].stops.find((s) => s.name === "Dinner with friends")!;
    expect(dinner.mapsUrl).toBeNull();
    expect(dinner.transport).toBe("?");
  });

  it("assigns option groups and resets them on 'Both options'", () => {
    const thu = trip!.days[2].stops;
    expect(thu.filter((s) => s.group?.startsWith("Option A")).map((s) => s.name)).toHaveLength(2);
    expect(thu.filter((s) => s.group?.startsWith("Option B")).map((s) => s.name)).toEqual([
      "Evening Spree dinner cruise",
    ]);
    expect(thu.at(-1)!.group).toBeNull();
  });

  it("collects day routes, extra markdown, meals and bags", () => {
    const thu = trip!.days[2];
    expect(thu.routes).toHaveLength(1);
    expect(thu.extraMarkdown).toContain("### Museum Island — other museums");
    expect(thu.extraMarkdown).not.toContain("Google Maps routes");
    expect(thu.meals.map((m) => m.label)).toEqual(["Breakfast", "Lunch", "Dinner"]);
    expect(thu.bags).toContain("Museum Island");
    expect(trip!.sections.map((s) => s.title)).toContain("Not placed yet");
  });
});

describe("parseTrip on broken input", () => {
  it("rejects empty input", () => {
    const r = parseTrip("");
    expect(r.trip).toBeNull();
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("requires the year in the title", () => {
    const r = parseTrip("# Trip\n\n## Tue 20.10 — x\n\n| Start | Name |\n|---|---|\n| 10:00 | A |");
    expect(r.errors.join()).toMatch(/year/);
  });

  it("warns about days without a usable table", () => {
    const r = parseTrip("# Trip 2026\n\n## Tue 20.10 — x\n\nno table\n\n## Wed 21.10\n\n| Start | Name |\n|---|---|\n| 10:00 | A |");
    expect(r.trip!.days).toHaveLength(1);
    expect(r.warnings.join()).toMatch(/no table/);
  });

  it("still reads the older 'address [🧭 Maps](url)' format", () => {
    const r = parseTrip(
      "# Trip 2026\n\n## Tue 20.10\n\n| Start | Name | Address |\n|---|---|---|\n| 10:00 | A | Main St 1, Berlin [🧭 Maps](https://www.google.com/maps/dir/?api=1&destination=x) |",
    );
    const stop = r.trip!.days[0].stops[0];
    expect(stop.address).toBe("Main St 1, Berlin");
    expect(stop.mapsUrl).toBe("https://www.google.com/maps/dir/?api=1&destination=x");
  });

  it("rolls the year over at New Year", () => {
    const r = parseTrip(
      "# Trip 2026\n\n## Thu 31.12\n\n| Start | Name |\n|---|---|\n| 10:00 | A |\n\n## Fri 01.01\n\n| Start | Name |\n|---|---|\n| 10:00 | B |",
    );
    expect(r.trip!.days.map((d) => d.date)).toEqual(["2026-12-31", "2027-01-01"]);
  });
});
