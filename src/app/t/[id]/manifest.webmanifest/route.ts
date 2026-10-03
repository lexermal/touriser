import { getTrip } from "@/lib/db";
import { DEMO_ID } from "@/lib/demoTrip";
import { getDemoTrip } from "@/lib/demoTrip.server";

// Home-screen labels cut off around 12 characters; keep whole words.
function shortName(name: string) {
  if (name.length <= 12) return name;
  let out = "";
  for (const word of name.split(/\s+/)) {
    if ((out ? out.length + 1 : 0) + word.length > 12) break;
    out = out ? `${out} ${word}` : word;
  }
  return out || name.slice(0, 12);
}

export async function GET(_req: Request, ctx: RouteContext<"/t/[id]/manifest.webmanifest">) {
  const { id } = await ctx.params;
  const stored = id === DEMO_ID ? getDemoTrip("Europe/Berlin") : getTrip(id);
  if (!stored) return new Response("Not found", { status: 404 });
  const name = stored.trip.title;
  // id + start_url carry the trip id, so the installed app always opens this trip.
  // The scope is the trip path, so several trips can be installed side by side.
  const manifest = {
    id: `/t/${id}`,
    name,
    short_name: shortName(name),
    description: `${name} — Touriser travel navigator`,
    start_url: `/t/${id}?source=pwa`,
    scope: `/t/${id}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
  });
}
