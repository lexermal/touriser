"use client";

import { Inline, Markdown } from "@/components/Markdown";
import type { TimedStop } from "@/lib/timeline";
import type { StoredTrip } from "@/lib/types";
import { TripHeader } from "./TripHeader";

type Props = {
  stored: StoredTrip;
  dayIndex: number;
  stops: TimedStop[];
  nowId: string | null;
  onInfo: () => void;
  onPick: (stopId: string) => void;
};

export function DayList({ stored, dayIndex, stops, nowId, onInfo, onPick }: Props) {
  const day = stored.trip.days[dayIndex];
  const dayStops = stops.filter((s) => s.dayIndex === dayIndex);
  return (
    <div className="min-h-dvh pb-12">
      <TripHeader title={stored.trip.title} onInfo={onInfo} />
      <main className="space-y-5 px-4 pt-4">
        <h1 className="text-lg font-semibold leading-snug" data-testid="day-heading">
          {day.weekday} {day.date.slice(8)}.{day.date.slice(5, 7)}
          {day.title && `: ${day.title}`}
        </h1>
        <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
          {dayStops.map((s) => (
            <li key={s.id}>
              <button onClick={() => onPick(s.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-slate-500">{s.start || "·"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    <Inline text={s.name} />
                    {s.id === nowId && <span className="ml-2 rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">now</span>}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {[s.category, s.group].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        {(day.meals.length > 0 || day.bags) && (
          <section className="rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900" data-testid="day-notes">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Food & bags</h2>
            <ul className="space-y-1.5">
              {day.meals.map((m) => (
                <li key={m.label}>
                  <span className="text-slate-500">{m.label}: </span>
                  <Inline text={m.value} />
                </li>
              ))}
              {day.bags && (
                <li>
                  <span className="text-slate-500">Bags: </span>
                  <Inline text={day.bags} />
                </li>
              )}
            </ul>
          </section>
        )}

        {day.routes.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Day routes</h2>
            <div className="flex flex-col gap-2">
              {day.routes.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white p-3 text-sm font-medium shadow-sm dark:bg-slate-900">
                  🗺️ {r.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {day.extraMarkdown && (
          <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <Markdown text={day.extraMarkdown} />
          </section>
        )}
      </main>
    </div>
  );
}
