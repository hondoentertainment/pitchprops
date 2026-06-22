"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { buildLeaderboard } from "@/lib/leaderboard";
import { formatMoney } from "@/lib/format";

export default function LeaderboardPage() {
  const hydrated = useStore((s) => s.hydrated);
  const bets = useStore((s) => s.bets);
  const balance = useStore((s) => s.balance);

  const stats = useMemo(() => computeStats(bets), [bets]);
  const list = useMemo(
    () =>
      buildLeaderboard({
        balance,
        profit: stats.profit,
        bets: stats.totalBets,
        winRate: stats.winRate,
        staked: stats.staked,
      }),
    [balance, stats]
  );

  const you = list.find((e) => e.isUser);

  if (!hydrated) {
    return <div className="card h-64 animate-pulse bg-ink-800/50" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-ink-300">
          Ranked by lifetime profit. You&apos;re up against the house regulars — board refreshes daily.
        </p>
      </div>

      {you && (
        <div className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-pitch-500/20 text-2xl">
              {you.avatar}
            </span>
            <div>
              <div className="font-bold">Your rank</div>
              <div className="text-sm text-ink-400">{you.bets} bets placed</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-pitch-300">#{you.rank}</div>
            <div
              className={`text-sm font-semibold tabular-nums ${
                you.profit >= 0 ? "text-pitch-300" : "text-accent-loss"
              }`}
            >
              {you.profit >= 0 ? "+" : ""}
              {formatMoney(you.profit)} PC
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem_4rem] gap-2 border-b border-ink-700 px-4 py-2.5 text-[11px] uppercase tracking-wide text-ink-400 sm:grid-cols-[2.5rem_1fr_6rem_6rem_5rem]">
          <span>#</span>
          <span>Bettor</span>
          <span className="text-right">Profit</span>
          <span className="text-right">ROI</span>
          <span className="text-right">Win%</span>
        </div>
        <ul>
          {list.map((e) => (
            <li
              key={e.name}
              className={`grid grid-cols-[2.5rem_1fr_5rem_5rem_4rem] items-center gap-2 px-4 py-3 text-sm sm:grid-cols-[2.5rem_1fr_6rem_6rem_5rem] ${
                e.isUser ? "bg-pitch-500/10" : "hover:bg-ink-800/50"
              }`}
            >
              <span className="font-bold tabular-nums text-ink-300">
                {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-lg">{e.avatar}</span>
                <span className={`truncate font-semibold ${e.isUser ? "text-pitch-300" : ""}`}>
                  {e.name}
                </span>
              </span>
              <span
                className={`text-right font-semibold tabular-nums ${
                  e.profit >= 0 ? "text-pitch-300" : "text-accent-loss"
                }`}
              >
                {e.profit >= 0 ? "+" : ""}
                {formatMoney(e.profit)}
              </span>
              <span
                className={`text-right tabular-nums ${
                  e.roi >= 0 ? "text-ink-200" : "text-accent-loss"
                }`}
              >
                {(e.roi * 100).toFixed(0)}%
              </span>
              <span className="text-right tabular-nums text-ink-300">
                {(e.winRate * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
