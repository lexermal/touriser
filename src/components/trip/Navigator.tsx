"use client";

import { useEffect, useRef, useState } from "react";
import { Inline } from "@/components/Markdown";
import { enableNotifications, notificationsSupported } from "@/lib/notify";
import { dayOptions, formatCountdown, type NowState, type TimedStop } from "@/lib/timeline";
import { isStandalone } from "@/lib/installPrompt";
import type { StoredTrip } from "@/lib/types";
import { StopCard } from "./StopCard";

type Props = {
  stored: StoredTrip;
  stops: TimedStop[];
  now: number;
  nowState: NowState;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  options: Record<number, string | null>;
  onOption: (day: number, value: string | null) => void;
  onOpenDay: (day: number) => void;
};

// Only shown for the current stop; a browsed stop needs no status.
function StatusLine({ stop, isNow, nowState, now }: { stop: TimedStop; isNow: boolean; nowState: NowState; now: number }) {
  let text: React.ReactNode = null;
  if (isNow && nowState.kind === "now") {
    text = (
      <span className="font-semibold text-green-700 dark:text-green-400">
        ● Now{stop.endMs ? ` · ${formatCountdown(stop.endMs - now)} left` : ""}
      </span>
    );
  } else if (isNow && (nowState.kind === "next" || nowState.kind === "before")) {
    const leave = stop.leaveByMs;
    text = (
      <span className="font-semibold text-orange-600 dark:text-orange-400">
        {nowState.kind === "before" ? "Trip starts" : "Next stop"} in {formatCountdown((stop.startMs ?? now) - now)}
        {leave && nowState.kind === "next" ? (leave <= now ? " · leave now" : ` · leave in ${formatCountdown(leave - now)}`) : ""}
      </span>
    );
  } else if (isNow && nowState.kind === "after") {
    text = <span className="font-semibold text-slate-500">Trip finished, hope it was great</span>;
  }
  if (!text) return null;
  return <p className="text-sm" data-testid="status">{text}</p>;
}

export function Navigator(p: Props) {
  const { stored, stops, nowState } = p;
  const nowStop = stops[nowState.index];
  const selectedIndex = p.selectedId ? stops.findIndex((s) => s.id === p.selectedId) : -1;
  // A selected stop can disappear when another option is chosen; fall back to "now".
  const index = selectedIndex >= 0 ? selectedIndex : nowState.index;
  const stop = stops[index];
  const isNow = index === nowState.index;
  const day = stored.trip.days[stop?.dayIndex ?? 0];
  const opts = dayOptions(stored.trip, day.index);
  const next = stops[index + 1];
  const touchX = useRef<number | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [askNotify, setAskNotify] = useState(false);

  useEffect(() => {
    setAskNotify(isStandalone() && notificationsSupported() && Notification.permission === "default");
  }, []);

  useEffect(() => {
    chipsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ inline: "center", block: "nearest" });
    window.scrollTo({ top: 0 });
  }, [index]);

  if (!stop) return null;

  const go = (i: number) => {
    if (i < 0 || i >= stops.length) return;
    p.onSelect(i === nowState.index ? null : stops[i].id);
  };

  return (
    <div
      className="flex min-h-dvh flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 70) go(dx < 0 ? index + 1 : index - 1);
      }}
    >
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
          {stored.trip.days.map((d) => {
            const active = d.index === day.index;
            const today = nowStop?.dayIndex === d.index;
            return (
              <button
                key={d.index}
                data-active={active}
                onClick={() => p.onOpenDay(d.index)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {d.weekday} {Number(d.date.slice(8))}
                {today && <span className="ml-1 text-orange-500">●</span>}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 pb-32 pt-4">
        <StatusLine stop={stop} isNow={isNow} nowState={nowState} now={p.now} />

        {opts.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm" data-testid="options">
            {[null, ...opts].map((o) => (
              <button
                key={o ?? "all"}
                onClick={() => p.onOption(day.index, o)}
                className={`rounded-full border px-3 py-1 ${
                  (p.options[day.index] ?? null) === o
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {o ? o.split(/\s+[—–-]\s+/)[0] : "Show all"}
              </button>
            ))}
          </div>
        )}

        <StopCard
          stop={stop}
          belowButton={
            next && (
              <>
                <hr className="border-slate-200 dark:border-slate-800" />
                <button onClick={() => go(index + 1)} className="block w-full text-left" data-testid="next-stop">
                  <span className="block text-sm text-slate-500">
                    Next stop: {[next.category, next.start && `at ${next.start}`].filter(Boolean).join(" ")}
                  </span>
                  <span className="mt-0.5 block text-lg font-semibold">
                    <Inline text={next.name} />
                  </span>
                </button>
              </>
            )
          }
        />

        {askNotify && (
          <div className="rounded-2xl bg-slate-900 p-4 text-sm text-white dark:bg-slate-800">
            <p>Keep a shortcut to this trip in your notifications. One tap gets you back here.</p>
            <div className="mt-3 flex gap-3">
              <button onClick={async () => { await enableNotifications(); setAskNotify(false); }} className="rounded-lg bg-orange-500 px-3 py-2 font-semibold">
                Turn on
              </button>
              <button onClick={() => setAskNotify(false)} className="px-3 py-2 text-slate-300">
                Not now
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="pb-safe fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-slate-50/95 px-4 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex gap-3">
          <button onClick={() => go(index - 1)} disabled={index === 0} className="flex-1 rounded-xl bg-white py-3.5 text-xl shadow-sm disabled:opacity-30 dark:bg-slate-900" aria-label="Previous stop">
            ◀
          </button>
          {!isNow && (
            <button onClick={() => p.onSelect(null)} className="flex-1 rounded-xl bg-slate-900 py-3.5 font-semibold text-white dark:bg-white dark:text-slate-900">
              Now
            </button>
          )}
          <button onClick={() => go(index + 1)} disabled={index >= stops.length - 1} className="flex-1 rounded-xl bg-white py-3.5 text-xl shadow-sm disabled:opacity-30 dark:bg-slate-900" aria-label="Next stop">
            ▶
          </button>
        </div>
      </nav>
    </div>
  );
}
