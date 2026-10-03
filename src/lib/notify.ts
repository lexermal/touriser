import { NOTIFY_KEY, safeStorage } from "./storage";

let lastBody = "";

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function notificationsEnabled() {
  return notificationsSupported() && Notification.permission === "granted" && safeStorage.get(NOTIFY_KEY) !== "off";
}

export async function enableNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const result = await Notification.requestPermission();
  if (result === "granted") safeStorage.set(NOTIFY_KEY, "on");
  return result === "granted";
}

/**
 * Posts (or replaces) the trip's single notification. It is a shortcut back into the app:
 * the app can only update it while it is running, so the main line stays generic.
 */
export async function showTripNotification(opts: { tripId: string; title: string; body: string; mapsUrl: string | null }) {
  if (!notificationsEnabled() || opts.body === lastBody) return;
  const reg = await navigator.serviceWorker.ready;
  lastBody = opts.body;
  await reg.showNotification(`${opts.title} — tap to see where you are`, {
    tag: `touriser-${opts.tripId}`,
    body: opts.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    requireInteraction: true,
    silent: true,
    data: { url: `/t/${opts.tripId}?source=pwa`, mapsUrl: opts.mapsUrl },
    // `actions` is supported by Chrome on Android but missing from the TS DOM types.
    ...({ actions: opts.mapsUrl ? [{ action: "navigate", title: "🧭 Navigate" }] : [] } as object),
  });
}

/** `disable` also remembers the user turned the shortcut off (vs. just removing a deleted trip's). */
export async function closeTripNotification(tripId: string, { disable }: { disable: boolean }) {
  if (!notificationsSupported()) return;
  if (disable) safeStorage.set(NOTIFY_KEY, "off");
  lastBody = "";
  const reg = await navigator.serviceWorker.getRegistration();
  (await reg?.getNotifications({ tag: `touriser-${tripId}` }))?.forEach((n) => n.close());
}
