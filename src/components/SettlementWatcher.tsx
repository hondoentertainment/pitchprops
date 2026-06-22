"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useScores } from "@/components/ScoresProvider";
import { useMatches } from "@/components/MatchesProvider";
import { suggestWinners } from "@/lib/grade";
import type { TeamNames } from "@/lib/grade-provider";

/**
 * Periodically settles bets whose match window has passed. Grades provider legs
 * from final scores when available; custom props can auto-grade when enabled.
 */
export function SettlementWatcher() {
  const settleDueBets = useStore((s) => s.settleDueBets);
  const hydrated = useStore((s) => s.hydrated);
  const autoSettleProps = useStore((s) => s.autoSettleProps);
  const customMarkets = useStore((s) => s.customMarkets);
  const customMatchMeta = useStore((s) => s.customMatchMeta);
  const { scoresByMatch } = useScores();
  const { matches } = useMatches();

  const teamsByMatch = useMemo(() => {
    const map: Record<string, TeamNames> = {};
    for (const m of matches) {
      map[m.id] = { home: m.home, away: m.away };
    }
    for (const [id, meta] of Object.entries(customMatchMeta)) {
      map[id] = { home: meta.home, away: meta.away };
    }
    return map;
  }, [matches, customMatchMeta]);

  useEffect(() => {
    if (!hydrated) return;

    const autoGradeFromScores = () => {
      const { customMarketResults, setCustomMarketResult } = useStore.getState();
      for (const [matchId, markets] of Object.entries(customMarkets)) {
        const score = scoresByMatch[matchId];
        if (!score || !score.completed) continue;
        const meta = customMatchMeta[matchId];
        if (!meta) continue;
        for (const market of markets) {
          if (customMarketResults[market.id]) continue;
          const winners = suggestWinners(market, score, { home: meta.home, away: meta.away });
          if (!winners || winners.length === 0) continue;
          setCustomMarketResult({
            marketId: market.id,
            matchId,
            status: "graded",
            winningSelectionIds: winners.map((selId) => `${matchId}::${market.id}::${selId}`),
            recordedAt: new Date().toISOString(),
            source: "auto",
          });
        }
      }
    };

    const tick = () => {
      if (autoSettleProps) autoGradeFromScores();
      settleDueBets({ scores: scoresByMatch, teams: teamsByMatch });
    };

    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [
    hydrated,
    autoSettleProps,
    customMarkets,
    customMatchMeta,
    scoresByMatch,
    teamsByMatch,
    settleDueBets,
  ]);

  return null;
}
