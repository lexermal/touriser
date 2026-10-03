"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isAndroid, isStandalone } from "@/lib/installPrompt";
import { plain } from "@/lib/markdown";
import { DEMO_ID } from "@/lib/demoTrip";
import { closeTripNotification, showTripNotification } from "@/lib/notify";
import { LAST_TRIP_KEY, optionsKey, safeStorage, tripCacheKey } from "@/lib/storage";
import { findNow, timeStops, visibleStops } from "@/lib/timeline";
import type { StoredTrip } from "@/lib/types";
import { DayList } from "./DayList";
import { InfoView } from "./InfoView";
import { InstallBanner, InstallGuide } from "./InstallGuide";
import { Navigator } from "./Navigator";

type Status = "loading" | "ready" | "gone" | "error";
type View = { kind: "nav" } | { kind: "day"; day: number } | { kind: "info" };

// After this long in the background, reopening the app jumps back to "now".
const RESET_AFTER_HIDDEN_MS = 5 * 60 * 1000;

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return now;
}

function readCache(id: string): StoredTrip | null {
  try {
    return JSON.parse(safeStorage.get(tripCacheKey(id)) ?? "null");
  } catch {
    return null;
  }
}

function forgetTrip(id: string) {
  safeStorage.remove(tripCacheKey(id));
  safeStorage.remove(optionsKey(id));
  if (safeStorage.get(LAST_TRIP_KEY) === id) safeStorage.remove(LAST_TRIP_KEY);
}

export function TripApp({ id }: { id: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [stored, setStored] = useState<StoredTrip | null>(null);
  const [options, setOptions] = useState<Record<number, string | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "nav" });
  const [install, setInstall] = useState<"guide" | "banner" | "none">("none");
  const now = useNow();

  // Load: show the cached copy at once (works offline), then refresh from the server.
  useEffect(() => {
    const cached = readCache(id);
    if (cached && cached.expiresAt <= Date.now()) {
      forgetTrip(id);
    } else if (cached) {
      setStored(cached);
      setStatus("ready");
    }
    try {
      setOptions(JSON.parse(safeStorage.get(optionsKey(id)) ?? "{}"));
    } catch {}
    // tz is only used by the demo trip, which is placed on "today" in the viewer's time zone.
    const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    fetch(`/api/trips/${id}?tz=${tz}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) {
          forgetTrip(id);
          setStored(null);
          setStatus("gone");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const fresh = (await res.json()) as StoredTrip;
        safeStorage.set(tripCacheKey(id), JSON.stringify(fresh));
        safeStorage.set(LAST_TRIP_KEY, id);
        setStored(fresh);
        setStatus("ready");
      })
      .catch(() => setStatus((s) => (s === "ready" ? s : "error")));
  }, [id]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // In dev the worker still handles install + notifications, but must not cache dev bundles.
      const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
      navigator.serviceWorker.register(url).catch(() => {});
    }
    if (isStandalone()) return;
    if (isAndroid()) setInstall(sessionStorage.getItem("touriser:skipInstall") ? "none" : "guide");
    else setInstall("banner");
  }, []);

  // Back gesture inside the installed app returns to the navigator instead of closing it.
  const openView = useCallback((v: View) => {
    history.pushState({ touriserView: v }, "");
    setView(v);
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setView((e.state?.touriserView as View | undefined) ?? { kind: "nav" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Coming back to the app (icon, notification) after a while: show where you are now.
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > RESET_AFTER_HIDDEN_MS) {
        setSelectedId(null);
        setView({ kind: "nav" });
      }
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "show-now") {
        setSelectedId(null);
        setView({ kind: "nav" });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, []);

  const stops = useMemo(
    () => (stored ? timeStops(stored.trip, visibleStops(stored.trip, options), stored.timezone) : []),
    [stored, options],
  );
  const nowState = useMemo(() => findNow(stops, now), [stops, now]);
  const nowStop = stops[nowState.index];

  useEffect(() => {
    if (!stored || !nowStop) return;
    const next = stops[nowState.index + 1];
    const body =
      nowState.kind === "now"
        ? `At ${plain(nowStop.name)}${nowStop.end ? ` until ${nowStop.end}` : ""}${next ? ` · next ${next.start} ${plain(next.name)}` : ""}`
        : `Next: ${nowStop.start} ${plain(nowStop.name)}`;
    const target = nowState.kind === "now" ? next ?? nowStop : nowStop;
    showTripNotification({ tripId: id, title: stored.trip.title, body, mapsUrl: target.mapsUrl }).catch(() => {});
  }, [id, stored, stops, nowState, nowStop]);

  function setOption(day: number, value: string | null) {
    const next = { ...options, [day]: value };
    setOptions(next);
    safeStorage.set(optionsKey(id), JSON.stringify(next));
  }

  async function deleteNow() {
    const res = await fetch(`/api/trips/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return false;
    forgetTrip(id);
    await closeTripNotification(id, { disable: false }).catch(() => {});
    setStored(null);
    setStatus("gone");
    return true;
  }

  if (status === "loading") {
    return <div className="flex min-h-dvh items-center justify-center text-slate-500">Loading your trip…</div>;
  }
  if (status === "gone" || status === "error" || !stored) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">{status === "error" ? "Can't load this trip" : "This trip is gone"}</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {status === "error"
            ? "You seem to be offline and this trip isn't saved on this phone yet. Try again with internet."
            : "It was deleted, either by someone with the link, or automatically 30 days after upload."}
        </p>
        <Link href="/" className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white">
          Create a new trip
        </Link>
      </main>
    );
  }

  if (install === "guide") {
    return (
      <InstallGuide
        title={stored.trip.title}
        onSkip={() => {
          sessionStorage.setItem("touriser:skipInstall", "1");
          setInstall("none");
        }}
      />
    );
  }

  // Phone-width column: on desktop the app looks like it does on the phone, centred.
  return (
    <div className="trip-theme mx-auto min-h-dvh max-w-md md:border-x md:border-[var(--line)] md:shadow-2xl">
      {install === "banner" && view.kind === "nav" && <InstallBanner onClose={() => setInstall("none")} />}
      {view.kind === "nav" && (
        <Navigator
          stored={stored}
          stops={stops}
          now={now}
          nowState={nowState}
          selectedId={selectedId}
          onSelect={setSelectedId}
          options={options}
          onOption={setOption}
          onOpenDay={(day) => openView({ kind: "day", day })}
        />
      )}
      {view.kind === "day" && (
        <DayList
          stored={stored}
          dayIndex={view.day}
          stops={stops}
          nowId={nowStop?.id ?? null}
          onInfo={() => openView({ kind: "info" })}
          onPick={(stopId) => {
            setSelectedId(stopId);
            history.back();
          }}
        />
      )}
      {view.kind === "info" && (
        <InfoView stored={stored} canDelete={id !== DEMO_ID} onBack={() => history.back()} onDelete={deleteNow} />
      )}
    </div>
  );
}
