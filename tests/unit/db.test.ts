import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createTrip, deleteExpiredTrips, deleteTrip, getDb, getTrip, resetDbForTests, RETENTION_MS } from "@/lib/db";
import { parseTrip } from "@/lib/parser";

const markdown = readFileSync(path.join(import.meta.dirname, "../../public/examples/berlin-trip.md"), "utf8");
const trip = parseTrip(markdown).trip!;

beforeEach(() => {
  process.env.DB_PATH = ":memory:";
  resetDbForTests();
});

describe("trip storage", () => {
  it("stores a trip and gives every upload a new id", () => {
    const a = createTrip({ markdown, timezone: "Europe/Berlin", trip });
    const b = createTrip({ markdown, timezone: "Europe/Berlin", trip });
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^[A-Za-z0-9]{22}$/);
    expect(getTrip(a.id)!.trip.title).toBe("Berlin Example Trip");
  });

  it("hides trips once 30 days have passed, even before the sweep", () => {
    const now = Date.now();
    const { id } = createTrip({ markdown, timezone: "Europe/Berlin", trip }, now);
    expect(getTrip(id, now + RETENTION_MS - 1)).not.toBeNull();
    expect(getTrip(id, now + RETENTION_MS)).toBeNull();
  });

  it("sweep removes the markdown of expired trips and keeps fresh ones", () => {
    const now = Date.now();
    const old = createTrip({ markdown, timezone: "Europe/Berlin", trip }, now - RETENTION_MS - 1000);
    const fresh = createTrip({ markdown, timezone: "Europe/Berlin", trip }, now);
    expect(deleteExpiredTrips(now)).toBe(1);
    const ids = getDb().prepare("SELECT id FROM trips").all().map((r) => (r as { id: string }).id);
    expect(ids).toEqual([fresh.id]);
    expect(ids).not.toContain(old.id);
  });

  it("deletes a trip on request", () => {
    const { id } = createTrip({ markdown, timezone: "Europe/Berlin", trip });
    expect(deleteTrip(id)).toBe(true);
    expect(getTrip(id)).toBeNull();
  });
});
