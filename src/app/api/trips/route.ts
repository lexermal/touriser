import { createTrip } from "@/lib/db";
import { isValidTimeZone } from "@/lib/demoTrip.server";
import { parseTrip } from "@/lib/parser";

const MAX_BYTES = 512 * 1024;
const UPLOADS_PER_HOUR = 30;
const uploadsByIp = new Map<string, number[]>();

function rateLimited(ip: string, now: number) {
  const recent = (uploadsByIp.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  uploadsByIp.set(ip, recent);
  return recent.length > UPLOADS_PER_HOUR;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip, Date.now())) {
    return Response.json({ errors: ["Too many uploads, try again later."] }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { markdown?: unknown; timezone?: unknown } | null;
  if (!body || typeof body.markdown !== "string") {
    return Response.json({ errors: ["Send JSON with a `markdown` field."] }, { status: 400 });
  }
  if (Buffer.byteLength(body.markdown) > MAX_BYTES) {
    return Response.json({ errors: ["The plan is too big (max 512 KB)."] }, { status: 413 });
  }
  if (!isValidTimeZone(body.timezone)) {
    return Response.json({ errors: ["Unknown time zone."] }, { status: 400 });
  }
  const { trip, errors, warnings } = parseTrip(body.markdown);
  if (!trip) return Response.json({ errors, warnings }, { status: 422 });

  const { id, expiresAt } = createTrip({ markdown: body.markdown, timezone: body.timezone, trip });
  return Response.json({ id, expiresAt, warnings }, { status: 201 });
}
