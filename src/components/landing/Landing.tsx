"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseTrip } from "@/lib/parser";
import { PLANNING_PROMPT } from "@/lib/planningPrompt";
import { LAST_TRIP_KEY, safeStorage } from "@/lib/storage";
import { CopyButton } from "./CopyButton";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { ResultCard } from "./ResultCard";
import { Stepper, type Step } from "./Stepper";

export function Landing() {
  const [step, setStep] = useState<Step>(1);
  const [reached, setReached] = useState<Step>(1);
  const [showPrompt, setShowPrompt] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [created, setCreated] = useState<{
    id: string;
    expiresAt: number;
  } | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const pasted = useRef(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setTimezones(Intl.supportedValuesOf?.("timeZone") ?? []);
  }, []);

  // Showing the prompt selects it, so a long-press "Copy" on the phone takes all of it.
  useEffect(() => {
    if (showPrompt) {
      promptRef.current?.focus();
      promptRef.current?.select();
    }
  }, [showPrompt]);

  function goTo(next: Step) {
    setStep(next);
    setReached((r) => (next > r ? next : r));
  }

  const preview = useMemo(
    () => (markdown.trim() ? parseTrip(markdown) : null),
    [markdown],
  );
  const stopCount =
    preview?.trip?.days.reduce((n, d) => n + d.stops.length, 0) ?? 0;

  async function create(text: string, tz = timezone) {
    if (!parseTrip(text).trip || saving) return;
    setSaving(true);
    setServerErrors([]);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: text, timezone: tz }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok || !body?.id) {
      setServerErrors(
        body?.errors ?? [
          "Could not save the trip. Check your connection and try again.",
        ],
      );
      return;
    }
    setCreated({ id: body.id, expiresAt: body.expiresAt });
    safeStorage.set(LAST_TRIP_KEY, body.id);
    goTo(3);
  }

  async function loadExample() {
    const text = await (await fetch("/examples/berlin-trip.md")).text();
    setMarkdown(text);
    setTimezone("Europe/Berlin");
    setCreated(null);
    await create(text, "Europe/Berlin");
  }

  return (
    <div className="landing relative min-h-dvh overflow-x-hidden">
      <div className="landing-bg" aria-hidden />
      <main className="relative mx-auto w-full max-w-5xl px-4 pb-16">
        <Hero />
        <div className="mx-auto max-w-2xl">
          <Stepper step={step} reached={reached} onGo={goTo} />

          <section
            className="landing-card rise"
            style={{ animationDelay: "400ms" }}
          >
            {/* key restarts the entry animation on every step change */}
            <div
              key={step}
              className="rise p-5 sm:p-7"
              style={{ animationDuration: "450ms" }}
            >
              {step === 1 && (
                <>
                  <h2 className="text-xl font-semibold">
                    Plan your trip with AI
                  </h2>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--muted)]">
                    Paste this prompt into any AI chat and plan your trip. Once the plan is
                    final, it creates the plan that in a nice format also Touriser understands.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyButton
                      text={PLANNING_PROMPT}
                      label="Copy prompt"
                      primary
                      onCopied={() => setTimeout(() => goTo(2), 650)}
                    />
                    <button
                      onClick={() => setShowPrompt((v) => !v)}
                      className="rounded-full border border-[var(--line)] bg-[var(--card)] px-5 py-3 text-sm font-semibold"
                    >
                      {showPrompt ? "Hide prompt" : "Show prompt"}
                    </button>
                  </div>
                  {showPrompt && (
                    <textarea
                      ref={promptRef}
                      readOnly
                      value={PLANNING_PROMPT}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label="Planning prompt"
                      className="font-ticket mt-4 h-72 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-[0.72rem] leading-relaxed outline-none selection:bg-[var(--accent-soft)]"
                    />
                  )}
                  <button
                    onClick={() => goTo(2)}
                    className="mt-5 block text-sm font-semibold text-[var(--accent)] underline underline-offset-4"
                  >
                    I already have a plan →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="text-xl font-semibold">
                    Paste your finished plan
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Paste in the trip plan ChatGPT or another AI assistant
                    created.
                  </p>
                  <textarea
                    value={markdown}
                    autoFocus
                    onPaste={() => (pasted.current = true)}
                    onChange={(e) => {
                      const text = e.target.value;
                      setMarkdown(text);
                      setCreated(null);
                      // A paste starts the trip right away; typed edits wait for the button.
                      if (pasted.current) {
                        pasted.current = false;
                        void create(text);
                      }
                    }}
                    placeholder="Paste the plan from your AI chat here…"
                    className="font-ticket mt-4 h-44 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-xs outline-none transition focus:border-[var(--accent)]"
                    aria-label="Trip plan markdown"
                  />

                  {saving && (
                    <div
                      className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]"
                      data-testid="creating"
                    >
                      <div className="shimmer px-4 py-3 text-sm font-semibold">
                        Building your trip…
                      </div>
                    </div>
                  )}

                  {preview && !saving && (
                    <div
                      className="mt-3 rounded-xl bg-[var(--paper)] p-3 text-sm"
                      data-testid="preview"
                    >
                      {preview.trip ? (
                        <p>
                          ✅ <strong>{preview.trip.title}</strong>:{" "}
                          {preview.trip.days.length} days, {stopCount} stops
                          <span className="text-[var(--muted)]">
                            {" "}
                            ({preview.trip.days[0]?.weekday}{" "}
                            {preview.trip.days[0]?.date} →{" "}
                            {preview.trip.days.at(-1)?.date})
                          </span>
                        </p>
                      ) : (
                        <ul className="space-y-1 text-red-600 dark:text-red-400">
                          {preview.errors.map((e) => (
                            <li key={e}>❌ {e}</li>
                          ))}
                        </ul>
                      )}
                      {preview.warnings.length > 0 && (
                        <ul className="mt-2 space-y-1 text-amber-700 dark:text-amber-400">
                          {preview.warnings.map((w) => (
                            <li key={w}>⚠️ {w}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {serverErrors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {serverErrors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {preview?.trip && !created && !saving ? (
                      <button
                        onClick={() => create(markdown)}
                        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_var(--accent)]"
                      >
                        Create my trip link
                      </button>
                    ) : (
                      <button
                        onClick={loadExample}
                        className="text-sm font-semibold text-[var(--accent)] underline underline-offset-4"
                      >
                        No plan yet? Try the example trip
                      </button>
                    )}
                    <label className="font-ticket flex items-center gap-2 text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                      Time zone
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="max-w-40 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1 text-xs normal-case tracking-normal text-[var(--ink)]"
                      >
                        {(timezones.includes(timezone)
                          ? timezones
                          : [timezone, ...timezones]
                        ).map((tz) => (
                          <option key={tz}>{tz}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              )}

              {step === 3 && created && (
                <>
                  <h2 className="mb-4 text-center text-xl font-semibold">
                    Last step: To use Touriser scan the QR code with your phone.
                  </h2>
                  <ResultCard id={created.id} expiresAt={created.expiresAt} />
                </>
              )}
            </div>
          </section>
        </div>

        <Footer />
      </main>
    </div>
  );
}
