/**
 * Phone frame around a real screenshot of the trip navigator (light/dark follow the system).
 * The whole phone links to the live demo; the "Try it live" pill makes that discoverable.
 */
export function PhoneMockup() {
  return (
    <a
      href="/t/demo"
      target="_blank"
      rel="noopener"
      aria-label="Try the live demo (opens in a new tab)"
      className="group relative mx-auto block w-[15.5rem] outline-none sm:w-[17rem]"
    >
      {/* soft glow behind the phone */}
      <div className="absolute -inset-8 rounded-full bg-[var(--glow)] blur-3xl" aria-hidden />
      <div className="phone relative rotate-[3deg] rounded-[2.4rem] bg-[#15130f] p-[0.55rem] shadow-[0_40px_80px_-30px_rgba(29,26,21,0.7)] transition duration-500 group-hover:-translate-y-2 group-hover:rotate-0 group-hover:shadow-[0_50px_90px_-30px_rgba(29,26,21,0.8)] group-focus-visible:rotate-0 group-focus-visible:ring-4 group-focus-visible:ring-[var(--accent)]">
        <div className="absolute left-1/2 top-[0.95rem] z-10 h-[0.9rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-[#15130f]" aria-hidden />
        {/* Status-bar strip so the notch doesn't cover the app's day chips */}
        <div className="overflow-hidden rounded-[1.9rem] bg-[#f8fafc] pt-7 dark:bg-[#020617]">
        <picture>
          <source srcSet="/landing/navigator-dark.jpg" media="(prefers-color-scheme: dark)" />
          <img
            src="/landing/navigator-light.jpg"
            alt="The trip app on a phone: it shows the current stop (Reichstag dome, 45 min left), a big Navigate button with 7 min walking, and the next stop."
            width={780}
            height={1560}
            className="block w-full"
          />
        </picture>
        </div>
      </div>

      {/* Callouts pointing at the two things that matter most */}
      <span className="font-ticket absolute -left-3 -top-3 -rotate-6 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-[var(--paper)] shadow-lg sm:-left-14">
        Where you are now
      </span>
      <span className="font-ticket absolute -right-4 top-[34%] rotate-3 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-white shadow-lg sm:-right-12">
        One tap to Maps
      </span>

      {/* Call to action on the phone's bottom edge */}
      <span className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_var(--accent)] transition duration-300 group-hover:scale-105">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Try it live ↗
      </span>
    </a>
  );
}
