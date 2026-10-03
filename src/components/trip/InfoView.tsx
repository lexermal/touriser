"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Inline, Markdown } from "@/components/Markdown";
import { closeTripNotification, enableNotifications, notificationsEnabled, notificationsSupported } from "@/lib/notify";
import type { StoredTrip } from "@/lib/types";
import { SubHeader } from "./TripHeader";

type Props = { stored: StoredTrip; canDelete: boolean; onBack: () => void; onDelete: () => Promise<boolean> };

export function InfoView({ stored, canDelete, onBack, onDelete }: Props) {
  const { trip } = stored;
  const [confirming, setConfirming] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [notify, setNotify] = useState<boolean | null>(null);

  useEffect(() => {
    setNotify(notificationsSupported() ? notificationsEnabled() : null);
  }, []);

  return (
    <div className="min-h-dvh pb-16">
      <SubHeader title="Trip info" onBack={onBack} />
      <main className="space-y-5 px-4 pt-4">
        <div>
          <h2 className="text-2xl font-bold">{trip.title}</h2>
          <p className="text-sm text-slate-500">
            {trip.days[0]?.date} → {trip.days.at(-1)?.date} · times in {stored.timezone}
          </p>
        </div>

        {trip.basics.length > 0 && (
          <dl className="divide-y divide-slate-200 rounded-2xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
            {trip.basics.map((b) => (
              <div key={b.label} className="px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{b.label}</dt>
                <dd className="mt-0.5 text-sm"><Inline text={b.value} /></dd>
              </div>
            ))}
          </dl>
        )}

        {trip.sections.map((s) => (
          <details key={s.title} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <summary className="font-semibold">{s.title}</summary>
            <div className="mt-3">
              <Markdown text={s.markdown} />
            </div>
          </details>
        ))}

        {notify !== null && (
          <section className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900">
            <span>Shortcut in notifications</span>
            <button
              onClick={async () => {
                if (notify) {
                  await closeTripNotification(stored.id, { disable: true });
                  setNotify(false);
                } else setNotify(await enableNotifications());
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium dark:border-slate-700"
            >
              {notify ? "Turn off" : "Turn on"}
            </button>
          </section>
        )}

        {canDelete ? (
          <section className="rounded-2xl border border-red-200 p-4 text-sm dark:border-red-900">
            <p>
              This plan is deleted automatically on <strong>{new Date(stored.expiresAt).toLocaleDateString()}</strong>. Anyone with
              the link can delete it now.
            </p>
            {confirming ? (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => setDeleteFailed(!(await onDelete()))}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
                >
                  Yes, delete for everyone
                </button>
                <button onClick={() => setConfirming(false)} className="px-3 py-2">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} className="mt-3 rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 dark:border-red-800 dark:text-red-400">
                Delete trip
              </button>
            )}
            {deleteFailed && <p className="mt-2 text-red-600">Couldn&apos;t delete. Are you online?</p>}
          </section>
        ) : (
          <p className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            This is the live demo. Its dates move with today, so you can always try it out.
          </p>
        )}

        <Link href="/" className="block text-center text-sm text-slate-500 underline">
          Create another trip
        </Link>
      </main>
    </div>
  );
}
