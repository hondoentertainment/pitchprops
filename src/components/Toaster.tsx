"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

const TONE_STYLES: Record<string, string> = {
  win: "border-pitch-500/50 text-pitch-200",
  loss: "border-accent-loss/50 text-accent-loss",
  info: "border-ink-600 text-ink-100",
};

export function Toaster() {
  const notifications = useStore((s) => s.notifications);
  const dismissNotice = useStore((s) => s.dismissNotice);

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {notifications.map((n) => (
        <Toast key={n.id} id={n.id} tone={n.tone} message={n.message} onDismiss={dismissNotice} />
      ))}
    </div>
  );
}

function Toast({
  id,
  tone,
  message,
  onDismiss,
}: {
  id: string;
  tone: string;
  message: string;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div role="status" className="pointer-events-auto w-full animate-slide-up">
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className={`w-full rounded-xl border bg-ink-800 px-4 py-3 text-left text-sm font-medium shadow-glow focus:outline-none focus:ring-2 focus:ring-pitch-500/50 ${
          TONE_STYLES[tone] ?? TONE_STYLES.info
        }`}
      >
        {message}
      </button>
    </div>
  );
}
