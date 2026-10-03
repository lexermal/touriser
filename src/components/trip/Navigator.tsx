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
  let tone = "bg-[var(--card)] text-[var(--muted)]";
  if (isNow && nowState.kind === "now") {
    tone = "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300";
    text = (
      <>
        <span className="motion-safe:animate-pulse">●</span> Now{stop.endMs ? ` · ${formatCountdown(stop.endMs - now)} left` : ""}
      </>
    );
  } else if (isNow && (nowState.kind === "next" || nowState.kind === "before")) {
    const leave = stop.leaveByMs;
    tone = "bg-[var(--accent-soft)] text-[var(--accent)]";
    text = (
      <>
        {nowState.kind === "before" ? "Trip starts" : "Next stop"} in {formatCountdown((stop.startMs ?? now) - now)}
        {leave && nowState.kind === "next" ? (leave <= now ? " · leave now" : ` · leave in ${formatCountdown(leave - now)}`) : ""}
      </>
    );
  } else if (isNow && nowState.kind === "after") {
    text = <>Trip finished, hope it was great</>;
  }
  if (!text) return null;
  return (
    <p className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-semibold ${tone}`} data-testid="status">
      <span>{text}</span>
    </p>
  );
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
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
          {stored.trip.days.map((d) => {
            const active = d.index === day.index;
            const today = nowStop?.dayIndex === d.index;
            return (
              <button
                key={d.index}
                data-active={active}
                onClick={() => p.onOpenDay(d.index)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)]"
                }`}
              >
                {d.weekday} {Number(d.date.slice(8))}
                {today && <span className="ml-1 text-[var(--accent)]">●</span>}
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
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--card)]"
                }`}
              >
                {o ? o.split(/\s+[—–-]\s+/)[0] : "Show all"}
              </button>
            ))}
          </div>
        )}

        {/* key replays the entry animation whenever another stop is shown */}
        <div key={stop.id} className="rise" style={{ animationDuration: "380ms" }}>
        <StopCard
          stop={stop}
          belowButton={
            next && (
              <button
                onClick={() => go(index + 1)}
                className="relative mt-2 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--card)] p-4 text-left transition active:scale-[0.99]"
                data-testid="next-stop"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-[var(--muted)]">
                    Next stop: {[next.category, next.start && `at ${next.start}`].filter(Boolean).join(" ")}
                  </span>
                  <span className="mt-1 block text-lg font-semibold leading-snug">
                    <Inline text={next.name} />
                  </span>
                </span>
                <span className="text-xl text-[var(--muted)]" aria-hidden>
                  ›
                </span>
              </button>
            )
          }
        />
        </div>

        {askNotify && (
          <div className="rounded-2xl bg-[var(--ink)] p-4 text-sm text-[var(--paper)]">
            <p>Keep a shortcut to this trip in your notifications. One tap gets you back here.</p>
            <div className="mt-3 flex gap-3">
              <button onClick={async () => { await enableNotifications(); setAskNotify(false); }} className="rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white">
                Turn on
              </button>
              <button onClick={() => setAskNotify(false)} className="px-3 py-2 opacity-70">
                Not now
              </button>
            </div>
          </div>
        )}
      </main>

      <nav className="pb-safe fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 px-4">
        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_90%,transparent)] p-1.5 shadow-[0_18px_40px_-18px_rgba(29,26,21,0.55)] backdrop-blur-md">
          <button
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="flex h-12 flex-1 items-center justify-center rounded-full text-lg transition active:bg-[var(--paper)] disabled:opacity-25"
            aria-label="Previous stop"
          >
            ◀
          </button>
          {!isNow && (
            <button
              onClick={() => p.onSelect(null)}
              className="h-12 flex-1 rounded-full bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_8px_20px_-8px_var(--accent)]"
            >
              Now
            </button>
          )}
          <button
            onClick={() => go(index + 1)}
            disabled={index >= stops.length - 1}
            className="flex h-12 flex-1 items-center justify-center rounded-full text-lg transition active:bg-[var(--paper)] disabled:opacity-25"
            aria-label="Next stop"
          >
            ▶
          </button>
        </div>
      </nav>
    </div>
  );
}
