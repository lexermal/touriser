import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Liveness/readiness: fails if the SQLite file on the volume can't be opened.
export function GET() {
  getDb().prepare("SELECT 1").get();
  return new Response("ok");
}
