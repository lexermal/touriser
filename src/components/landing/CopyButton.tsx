"use client";

import { useState } from "react";

type Props = { text: string; label: string; primary?: boolean; onCopied?: () => void };

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older Android WebViews without clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function CopyButton({ text, label, primary, onCopied }: Props) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await copyText(text);
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className={
        primary
          ? "rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_var(--accent)] transition active:scale-95"
          : "rounded-full border border-[var(--line)] bg-[var(--card)] px-5 py-3 text-sm font-semibold transition active:scale-95"
      }
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
