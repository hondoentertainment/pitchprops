"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { MatchScore } from "@/lib/types";

interface ScoresState {
  scoresByMatch: Record<string, MatchScore>;
  source: "live" | "mock" | null;
  loading: boolean;
  refresh: () => void;
}

const ScoresContext = createContext<ScoresState | null>(null);

export function ScoresProvider({ children }: { children: React.ReactNode }) {
  const [scoresByMatch, setScoresByMatch] = useState<Record<string, MatchScore>>({});
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/scores");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        const map: Record<string, MatchScore> = {};
        for (const s of (data.scores ?? []) as MatchScore[]) {
          map[s.matchId] = s;
        }
        setScoresByMatch(map);
        setSource(data.source ?? null);
      } catch {
        if (!cancelled) setScoresByMatch({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <ScoresContext.Provider
      value={{ scoresByMatch, source, loading, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </ScoresContext.Provider>
  );
}

export function useScores() {
  const ctx = useContext(ScoresContext);
  if (!ctx) throw new Error("useScores must be used within ScoresProvider");
  return ctx;
}
