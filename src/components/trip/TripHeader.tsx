"use client";

/** Top bar of the navigator and day plan: trip name + Info, optional extra row below. */
export function TripHeader({ title, onInfo, children }: { title: string; onInfo: () => void; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className={`flex items-center gap-2 px-4 pt-2 ${children ? "" : "pb-2"}`}>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
        <button onClick={onInfo} className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label="Trip info">
          ⓘ Info
        </button>
      </div>
      {children}
    </header>
  );
}

/** Top bar of sub pages (Info): back arrow + title. */
export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-2 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <button onClick={onBack} className="rounded-full px-3 py-2 text-lg" aria-label="Back">
        ←
      </button>
      <h1 className="min-w-0 flex-1 truncate font-semibold">{title}</h1>
    </header>
  );
}
