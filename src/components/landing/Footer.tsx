export function Footer() {
  return (
    <footer className="font-ticket mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted)]">
      <span>
        Made with <span className="text-[var(--accent)]">♥</span> in Sweden
      </span>
      <span aria-hidden>·</span>
      <a href="https://github.com/lexermal/touriser" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
        GitHub
      </a>
      <span aria-hidden>·</span>
      <a href="https://www.instagram.com/alex.w.builds" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
        Instagram
      </a>
    </footer>
  );
}
