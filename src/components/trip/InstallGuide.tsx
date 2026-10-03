"use client";

import { useEffect, useState } from "react";
import { canPromptInstall, onInstallPromptChange, promptInstall } from "@/lib/installPrompt";

export function InstallGuide({ title, onSkip }: { title: string; onSkip: () => void }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setCanPrompt(canPromptInstall());
    const off = onInstallPromptChange(() => setCanPrompt(canPromptInstall()));
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      off();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-12" data-testid="install-guide">
      <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-2xl" />
      <h1 className="mt-6 text-2xl font-bold leading-tight">Install “{title}” on your phone</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        As an app it opens straight to where you are on your trip. No searching, one tap to navigate.
      </p>

      {installed ? (
        <div className="mt-8 rounded-2xl bg-green-50 p-5 text-green-900 dark:bg-green-950 dark:text-green-200">
          <p className="text-lg font-semibold">Installed ✓</p>
          <p className="mt-1">Open it from your home screen. You can close this browser tab.</p>
        </div>
      ) : canPrompt ? (
        <button
          onClick={async () => setInstalled(await promptInstall())}
          className="mt-8 w-full rounded-2xl bg-orange-500 px-5 py-4 text-lg font-semibold text-white"
        >
          Install app
        </button>
      ) : (
        <ol className="mt-8 space-y-4">
          {[
            <>Tap the <strong>⋮ menu</strong> at the top right of Chrome</>,
            <>Tap <strong>“Add to Home screen”</strong> or <strong>“Install app”</strong></>,
            <>Tap <strong>Install</strong></>,
            <>Open the trip from your <strong>home screen</strong></>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">{i + 1}</span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      )}

      <button onClick={onSkip} className="mt-auto pt-10 text-sm text-slate-500 underline underline-offset-2">
        Continue in the browser instead
      </button>
    </main>
  );
}

export function InstallBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-800">
      <span className="flex-1">📱 Open this link on your Android phone to install the trip as an app.</span>
      <button onClick={onClose} aria-label="Close" className="px-2 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
