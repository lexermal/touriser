import type { Metadata } from "next";
import { bodyFont, displayFont, monoFont } from "@/app/fonts";
import { TripApp } from "@/components/trip/TripApp";
import { getTrip } from "@/lib/db";
import { DEMO_ID } from "@/lib/demoTrip";
import { getDemoTrip } from "@/lib/demoTrip.server";

export async function generateMetadata({ params }: PageProps<"/t/[id]">): Promise<Metadata> {
  const { id } = await params;
  const stored = id === DEMO_ID ? getDemoTrip("Europe/Berlin") : getTrip(id);
  return {
    title: stored ? `${stored.trip.title} · Touriser` : "Trip · Touriser",
    // Per-trip manifest: installing from here bakes the trip id into the app.
    manifest: `/t/${id}/manifest.webmanifest`,
  };
}

export default async function TripPage({ params }: PageProps<"/t/[id]">) {
  const { id } = await params;
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <TripApp id={id} />
    </div>
  );
}
