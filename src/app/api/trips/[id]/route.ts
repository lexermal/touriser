import { deleteTrip, getTrip } from "@/lib/db";
import { DEMO_ID } from "@/lib/demoTrip";
import { getDemoTrip, isValidTimeZone } from "@/lib/demoTrip.server";

const noStore = { "Cache-Control": "no-store" };

export async function GET(req: Request, ctx: RouteContext<"/api/trips/[id]">) {
  const { id } = await ctx.params;
  if (id === DEMO_ID) {
    // The demo runs in the viewer's time zone so "now" matches their clock.
    const tz = new URL(req.url).searchParams.get("tz");
    return Response.json(getDemoTrip(isValidTimeZone(tz) ? tz : "Europe/Berlin"), { headers: noStore });
  }
  const trip = getTrip(id);
  if (!trip) return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  return Response.json(trip, { headers: noStore });
}

// Anyone who has the trip link can delete it — the link is the only key.
export async function DELETE(_req: Request, ctx: RouteContext<"/api/trips/[id]">) {
  const { id } = await ctx.params;
  if (id === DEMO_ID) return Response.json({ error: "demo_cannot_be_deleted" }, { status: 403, headers: noStore });
  deleteTrip(id);
  return new Response(null, { status: 204, headers: noStore });
}
