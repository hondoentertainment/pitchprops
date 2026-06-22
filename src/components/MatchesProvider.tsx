"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Match } from "@/lib/types";
import { useStore } from "@/lib/store";

interface MatchesState {
  matches: Match[];
  source: "live" | "mock" | null;
  note?: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const MatchesContext = createContext<MatchesState | null>(null);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [note, setNote] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const customMarkets = useStore((s) => s.customMarkets);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/matches");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        setMatches(data.matches ?? []);
        setSource(data.source ?? null);
        setNote(data.note);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load matches");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const mergedMatches = useMemo(() => {
    return matches.map((m) => {
      const extra = customMarkets[m.id];
      return extra && extra.length > 0 ? { ...m, markets: [...m.markets, ...extra] } : m;
    });
  }, [matches, customMarkets]);

  return (
    <MatchesContext.Provider
      value={{
        matches: mergedMatches,
        source,
        note,
        loading,
        error,
        refresh: () => setTick((t) => t + 1),
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error("useMatches must be used within MatchesProvider");
  return ctx;
}
