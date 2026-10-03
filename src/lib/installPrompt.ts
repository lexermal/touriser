// Chrome fires `beforeinstallprompt` once, possibly before React mounts, so it is
// captured at module load and handed to whoever subscribes later.
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
}

export function canPromptInstall() {
  return deferred !== null;
}

export function onInstallPromptChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  listeners.forEach((l) => l());
  return outcome === "accepted";
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    new URLSearchParams(location.search).get("source") === "pwa"
  );
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
