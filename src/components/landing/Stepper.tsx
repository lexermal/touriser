export type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string; icon: React.ReactNode }[] = [
  {
    n: 1,
    label: "Plan your trip",
    icon: (
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    ),
  },
  {
    n: 2,
    label: "Paste trip plan",
    icon: <path d="M9 3h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    n: 3,
    label: "Get app",
    icon: <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5z" />,
  },
];

/** Three stops on a dashed route. Tapping a step you already reached goes back to it. */
export function Stepper({ step, reached, onGo }: { step: Step; reached: Step; onGo: (s: Step) => void }) {
  return (
    <nav aria-label="Steps" className="rise relative mb-5 flex items-start justify-between px-2" style={{ animationDelay: "320ms" }}>
      <span className="absolute left-12 right-12 top-7 border-t-2 border-dashed border-[var(--line)]" aria-hidden />
      <span
        className="absolute left-12 top-7 border-t-2 border-dashed border-[var(--accent)] transition-all duration-500"
        style={{ width: `calc((100% - 6rem) * ${(step - 1) / 2})` }}
        aria-hidden
      />
      {STEPS.map(({ n, label, icon }) => {
        const current = n === step;
        const done = n < step || (n < reached && !current);
        const enabled = n <= reached && !current;
        return (
          <button
            key={n}
            onClick={() => onGo(n)}
            disabled={!enabled}
            aria-current={current ? "step" : undefined}
            className="group relative z-10 flex w-24 flex-col items-center gap-1.5 disabled:cursor-default"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                current
                  ? "scale-110 border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_10px_24px_-8px_var(--accent)]"
                  : done
                    ? "border-[var(--stamp)] bg-[var(--card)] text-[var(--stamp)] group-hover:scale-105"
                    : "border-[var(--line)] bg-[var(--card)] text-[var(--line)]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                {icon}
              </svg>
            </span>
            <span
              className={`font-ticket text-center text-[0.62rem] uppercase leading-snug tracking-[0.18em] ${current ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
