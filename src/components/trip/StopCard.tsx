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

  return (
    <article className="space-y-4" data-testid="stop-card">
      <div>
        <h1 className="text-[1.7rem] font-bold leading-tight">
          <span className="mr-2" title={category.label} aria-label={category.label}>
            {category.icon}
          </span>
          <span data-testid="stop-name">
            <Inline text={stop.name} />
          </span>
        </h1>
        {stop.info && !isEmptyCell(stop.info) && (
          <p className="mt-2 text-slate-700 dark:text-slate-300" data-testid="stop-info">
            <Inline text={stop.info} />
          </p>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium tabular-nums text-slate-600 dark:text-slate-400" data-testid="stop-time">
            {timeLabel(stop)}
          </span>
          {stop.group && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-300">
              {stop.group}
            </span>
          )}
        </p>
      </div>

      {stop.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stop.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
            >
              🔗 {l.label}
            </a>
          ))}
        </div>
      )}

      {stop.mapsUrl ? (
        <a
          href={stop.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl bg-orange-500 px-5 py-4 text-center text-white shadow-lg shadow-orange-500/20 active:bg-orange-600"
          data-testid="navigate"
        >
          <span className="flex items-center justify-center gap-2 text-lg font-semibold">
            Navigate
            <span className="font-normal">({[transportIcon(transport), travelTime].filter(Boolean).join(" ")})</span>
          </span>
        </a>
      ) : (
        <div className="rounded-2xl bg-slate-200 px-5 py-4 text-center text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          No address to navigate to yet
        </div>
      )}

      {belowButton}

    </article>
  );
}
