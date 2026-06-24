"use client";

import { useSyncExternalStore, useCallback } from "react";

const KEY = "pitchprops-theme";

function getTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.dataset.theme as "dark" | "light" | undefined) ?? "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener("pitchprops-theme", onChange);
  return () => window.removeEventListener("pitchprops-theme", onChange);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");

  const toggle = useCallback(() => {
    const next = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, next);
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("pitchprops-theme"));
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="min-h-11 min-w-11 rounded-xl border border-ink-600 bg-ink-750 px-2.5 text-sm hover:border-pitch-500"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
