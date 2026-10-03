import { Inline } from "@/components/Markdown";
import { isEmptyCell } from "@/lib/markdown";
import { formatDuration, parseClock, type TimedStop } from "@/lib/timeline";
import { splitCategory } from "@/lib/category";
import { transportIcon } from "@/lib/transport";

// "Until 14:15 (30 min)" when the plan has an end time; stops without one just show their start.
export function timeLabel(stop: TimedStop) {
  if (parseClock(stop.end) !== null && stop.startMs !== null && stop.endMs !== null) {
    return `Until ${stop.end.replace(/^~/, "")} (${formatDuration(stop.endMs - stop.startMs)})`;
  }
  return stop.start && !isEmptyCell(stop.start) ? `From ${stop.start}` : "";
}

export function StopCard({ stop, belowButton }: { stop: TimedStop; belowButton?: React.ReactNode }) {
  const category = splitCategory(stop.category);
  const known = (t: string) => (t && !isEmptyCell(t) ? t : "");
  const transport = known(stop.transport);
  const travelTime = known(stop.travelTime);
  const time = timeLabel(stop);

  return (
    <article className="space-y-5" data-testid="stop-card">
      <div>
        <h1 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-tight">
          <span className="mr-2 inline-block -translate-y-0.5 text-[1.8rem]" title={category.label} aria-label={category.label}>
            {category.icon}
          </span>
          <span data-testid="stop-name">
            <Inline text={stop.name} />
          </span>
        </h1>
        {stop.info && !isEmptyCell(stop.info) && (
          <p className="mt-3 text-[1.02rem] leading-relaxed text-[color-mix(in_srgb,var(--ink)_80%,transparent)]" data-testid="stop-info">
            <Inline text={stop.info} />
          </p>
        )}
        {(time || stop.group) && (
          <p className="mt-3 flex flex-wrap items-center gap-2">
            {time && (
              <span
                className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1 text-sm font-medium text-[var(--muted)]"
                data-testid="stop-time"
              >
                {time}
              </span>
            )}
            {stop.group && (
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
                {stop.group}
              </span>
            )}
          </p>
        )}
      </div>

      {stop.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stop.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--card)] px-3.5 py-2 text-sm font-medium shadow-sm transition active:scale-95"
            >
              <span aria-hidden>🔗</span> {l.label}
            </a>
          ))}
        </div>
      )}

      {stop.mapsUrl ? (
        <a
          href={stop.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-between gap-3 rounded-[1.4rem] bg-gradient-to-br from-[var(--accent)] to-[#ff7d45] py-3 pl-6 pr-3 text-white shadow-[0_6px_14px_-8px_var(--accent)] transition active:scale-[0.98]"
          data-testid="navigate"
        >
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">Navigate</span>
            <span className="text-base opacity-90">({[transportIcon(transport), travelTime].filter(Boolean).join(" ")})</span>
          </span>
          {/* SVG instead of the "→" glyph, which sits below the middle in most fonts */}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-active:translate-x-0.5" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </a>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] px-5 py-4 text-center text-[var(--muted)]">
          No address to navigate to yet
        </div>
      )}

      {belowButton}
    </article>
  );
}
