// Touriser service worker: offline app shell + notification clicks.
// Trip data itself is cached by the page in localStorage, not here.
const CACHE = "touriser-v1";
// Registered as /sw.js?dev=1 by `next dev`: no caching, so code changes show up immediately.
const DEV = new URL(self.location.href).searchParams.has("dev");

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(CACHE)).put(request, res.clone());
  return res;
}

async function networkFirst(request, key) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(CACHE)).put(key, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(key, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (DEV || request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    // Key by path only, so /t/<id>?source=pwa and /t/<id> share one offline copy.
    event.respondWith(networkFirst(request, url.origin + url.pathname));
  } else if (url.pathname.endsWith("/manifest.webmanifest")) {
    event.respondWith(networkFirst(request, request));
  }
});

self.addEventListener("notificationclick", (event) => {
  const { url, mapsUrl } = event.notification.data || {};
  // Not closing the notification on purpose: it stays as a shortcut back into the trip.
  event.waitUntil(
    (async () => {
      if (event.action === "navigate" && mapsUrl) return self.clients.openWindow(mapsUrl);
      const path = url ? new URL(url, self.location.origin).pathname : "/";
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = all.find((c) => new URL(c.url).pathname === path);
      if (open) {
        open.postMessage({ type: "show-now" });
        return open.focus();
      }
      return self.clients.openWindow(url || "/");
    })(),
  );
});
