"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { copyText } from "./CopyButton";

function NumberedSteps({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-snug">
          <span className="font-ticket flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[0.7rem] font-bold text-[var(--paper)]">
            {i + 1}
          </span>
          <span className="pt-0.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function ResultCard({ id, expiresAt }: { id: string; expiresAt: number }) {
  const [url, setUrl] = useState(`/t/${id}`);
  const [canShare, setCanShare] = useState(false);
  const [onPhone, setOnPhone] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const urlRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const full = `${location.origin}/t/${id}`;
    setUrl(full);
    setCanShare(typeof navigator.share === "function");
    // On a phone the user installs right here; on a computer they move to the phone via QR code.
    setOnPhone(/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent));
    QRCode.toDataURL(full, { margin: 1, width: 360, color: { dark: "#1d1a15", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [id]);

  // One tap on the link box copies it and selects it, so it's obvious what was copied.
  async function copyLink() {
    await copyText(url);
    const sel = window.getSelection();
    if (urlRef.current && sel) {
      const range = document.createRange();
      range.selectNodeContents(urlRef.current);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div data-testid="result">

      {onPhone ? (
        <div className="mt-4">
          <a
            href={`/t/${id}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-12px_var(--accent)]"
          >
            Install on this phone →
          </a>
          <div className="mt-5">
            <NumberedSteps
              steps={[
                <>Tap the button above</>,
                <>
                  Follow the short guide and tap <strong>Install</strong>
                </>,
                <>During the trip, open it from your home screen</>,
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <figure className="w-44 rounded-2xl bg-white p-2 shadow-md" data-testid="qr">
            {qr ? <img src={qr} alt={`QR code for ${url}`} className="block w-full" /> : <div className="aspect-square" />}
          </figure>
        </div>
      )}

      <button
        onClick={copyLink}
        aria-label="Copy trip link"
        className="mt-6 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--paper)] p-3 text-left transition hover:border-[var(--accent)]"
      >
        <span ref={urlRef} className="font-ticket min-w-0 flex-1 break-all text-sm selection:bg-[var(--accent-soft)]" data-testid="trip-url">
          {url}
        </span>
        <span className={`shrink-0 ${copied ? "text-[var(--stamp)]" : "text-[var(--muted)]"}`} aria-live="polite">
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <title>Copied</title>
              <path d="M5 12l5 5 9-11" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <title>Copy</title>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
        {!onPhone && (
          <a href={`/t/${id}`} target="_blank" rel="noopener" className="text-[var(--accent)] underline underline-offset-4">
            Open your trip ↗
          </a>
        )}
        {canShare && (
          <button onClick={() => navigator.share({ title: "My trip", url }).catch(() => {})} className="text-[var(--accent)] underline underline-offset-4">
            Share link
          </button>
        )}
      </div>

      <p className="mt-5 text-[0.7rem] tracking-widest text-[var(--muted)]">
        The trip gets auto-deleted on {new Date(expiresAt).toLocaleDateString()} or earlier via the trip settings.
      </p>
    </div>
  );
}
