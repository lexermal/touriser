import "server-only";
import { randomInt } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { StoredTrip, Trip } from "./types";

export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const file = process.env.DB_PATH ?? path.join(process.cwd(), "data", "touriser.db");
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  // secure_delete overwrites deleted rows with zeros, so an expired plan can't be read
  // back from free pages of the file. DELETE journal mode avoids a WAL file keeping old pages.
  db.exec(`
    PRAGMA secure_delete = ON;
    PRAGMA journal_mode = DELETE;
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      timezone TEXT NOT NULL,
      markdown TEXT NOT NULL,
      parsed_json TEXT NOT NULL,
      uploaded_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS trips_expires_at ON trips (expires_at);
  `);
  return db;
}

/** Test hook: use a fresh database file. */
export function resetDbForTests() {
  db?.close();
  db = null;
}

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 22 letters/digits (~131 bits): unguessable, and no "-"/"_" so links copy and read cleanly. */
function newId() {
  let id = "";
  for (let i = 0; i < 22; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return id;
}

export function createTrip(input: { markdown: string; timezone: string; trip: Trip }, now = Date.now()) {
  const id = newId();
  const expiresAt = now + RETENTION_MS;
  getDb()
    .prepare(
      "INSERT INTO trips (id, title, timezone, markdown, parsed_json, uploaded_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, input.trip.title, input.timezone, input.markdown, JSON.stringify(input.trip), now, expiresAt);
  return { id, expiresAt };
}

export function getTrip(id: string, now = Date.now()): StoredTrip | null {
  // The expiry check here makes deletion exact even if the sweep hasn't run yet.
  const row = getDb()
    .prepare("SELECT id, timezone, parsed_json, uploaded_at, expires_at FROM trips WHERE id = ? AND expires_at > ?")
    .get(id, now) as
    | { id: string; timezone: string; parsed_json: string; uploaded_at: number; expires_at: number }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    timezone: row.timezone,
    uploadedAt: row.uploaded_at,
    expiresAt: row.expires_at,
    trip: JSON.parse(row.parsed_json) as Trip,
  };
}

export function deleteTrip(id: string): boolean {
  return Number(getDb().prepare("DELETE FROM trips WHERE id = ?").run(id).changes) > 0;
}

export function deleteExpiredTrips(now = Date.now()): number {
  const removed = Number(getDb().prepare("DELETE FROM trips WHERE expires_at <= ?").run(now).changes);
  // VACUUM rewrites the file so nothing of the deleted plans stays on disk.
  if (removed > 0) getDb().exec("VACUUM");
  return removed;
}
