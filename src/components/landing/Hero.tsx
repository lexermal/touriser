import { PhoneMockup } from "./PhoneMockup";

export function Hero() {
  return (
    <header className="relative pb-8 pt-10 sm:pt-16">
      <div className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="rise font-display text-[2.9rem] font-semibold leading-[0.95] tracking-tight sm:text-7xl" style={{ animationDelay: "80ms" }}>
            Enjoy your trip.
            <br />
            Touriser manages
            <br />
            the <em className="font-normal text-[var(--accent)]">highlights.</em>
          </h1>

          {/* Dashed route with a pin travelling along it; overflow-visible so the pin isn't clipped at the curve's top */}
          <svg viewBox="0 0 360 100" className="rise mt-6 h-20 w-full max-w-md overflow-visible" style={{ animationDelay: "160ms" }} aria-hidden>
            <path d="M8 70 C 70 10, 120 110, 190 52 S 300 18, 352 40" fill="none" stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
            <path className="route-dash" d="M8 70 C 70 10, 120 110, 190 52 S 300 18, 352 40" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="8" cy="70" r="5" fill="var(--ink)" />
            <circle cx="352" cy="40" r="5" fill="var(--ink)" />
            <g className="route-pin">
              {/* The pin's tip sits 5px below its origin; shift it up so the tip touches the line. */}
              <g transform="translate(0 -5)">
                <path d="M0 -14 a7 7 0 0 1 7 7 c0 5 -7 12 -7 12 s-7 -7 -7 -12 a7 7 0 0 1 7 -7z" fill="var(--accent)" />
                <circle cy="-7" r="2.6" fill="var(--card)" />
              </g>
            </g>
          </svg>

          <p className="rise mt-4 max-w-md text-[1.05rem] leading-relaxed text-[var(--muted)]" style={{ animationDelay: "240ms" }}>
            Touriser turns your travel plan into an app on your phone. It always shows the current highlight&apos;s info and
            what&apos;s next. With one tap you&apos;re on your way to the next highlight. Made for travelers who planned ahead and
            want to enjoy the trip. Free.
          </p>
        </div>

        <div className="rise pb-10 pt-4" style={{ animationDelay: "300ms" }}>
          <PhoneMockup />
        </div>
      </div>

      <h2 className="rise font-display mt-14 text-3xl font-semibold tracking-tight text-center mt-20 sm:text-4xl" style={{ animationDelay: "650ms" }}>
        Get your trip app in <em className="font-normal text-[var(--accent)]">3 steps</em>
      </h2>
    </header>
  );
}
