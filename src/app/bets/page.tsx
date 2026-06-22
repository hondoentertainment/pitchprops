"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMatches } from "@/components/MatchesProvider";
import { SettlePropForm } from "@/components/SettlePropForm";
import { computeAchievements, computeStats, profitCurve } from "@/lib/stats";
import { formatMoney, relativeTime, toAmerican } from "@/lib/format";
import { ProfitChart } from "@/components/ProfitChart";
import { ShareBetButton } from "@/components/ShareBetButton";
import { isCustomMarket, type Market, type Match, type PlacedBet } from "@/lib/types";

type Filter = "all" | "open" | "won" | "lost";

export default function BetsPage() {
  const hydrated = useStore((s) => s.hydrated);
  const bets = useStore((s) => s.bets);
  const balance = useStore((s) => s.balance);
  const resetBankroll = useStore((s) => s.resetBankroll);
  const customResults = useStore((s) => s.customMarketResults);
  const { matches } = useMatches();

  const [filter, setFilter] = useState<Filter>("all");
  const [settleTarget, setSettleTarget] = useState<{ match: Match; market: Market } | null>(null);

  const toSettle = useMemo(() => {
    const seen = new Set<string>();
    const list: { match: Match; market: Market }[] = [];
    for (const bet of bets) {
      if (bet.status !== "open") continue;
      for (const leg of bet.legs) {
        if (!isCustomMarket(leg.marketId) || customResults[leg.marketId] || seen.has(leg.marketId)) {
          continue;
        }
        const match = matches.find((m) => m.id === leg.matchId);
        const market = match?.markets.find((mk) => mk.id === leg.marketId);
        if (match && market) {
          seen.add(leg.marketId);
          list.push({ match, market });
        }
      }
    }
    return list;
  }, [bets, customResults, matches]);

  const stats = useMemo(() => computeStats(bets), [bets]);
  const curve = useMemo(() => profitCurve(bets), [bets]);
  const achievements = useMemo(() => computeAchievements(bets, stats), [bets, stats]);

  const filtered = useMemo(
    () => (filter === "all" ? bets : bets.filter((b) => b.status === filter)),
    [bets, filter]
  );

  if (!hydrated) {
    return <div className="card h-64 animate-pulse bg-ink-800/50" />;
  }

  if (bets.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="mb-3 text-5xl">📊</div>
        <h1 className="text-xl font-bold">No bets tracked yet</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-300">
          Place your first bet to start building your performance dashboard — ROI, win streaks,
          profit curve and achievements all live here.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          Browse markets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Performance</h1>
          <p className="text-sm text-ink-300">Track every bet, streak and payout.</p>
        </div>
        <button onClick={resetBankroll} className="btn-ghost text-xs">
          Reset bankroll
        </button>
      </div>

      {settleTarget && (
        <SettlePropForm
          match={settleTarget.match}
          market={settleTarget.market}
          onClose={() => setSettleTarget(null)}
        />
      )}

      {toSettle.length > 0 && (
        <section className="card border border-accent-gold/40 p-5">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-bold">Props to settle</h2>
            <span className="chip text-accent-gold">{toSettle.length}</span>
          </div>
          <p className="mb-3 text-sm text-ink-300">
            These custom props have open bets waiting on a result. Record the outcome to settle them.
          </p>
          <ul className="space-y-2">
            {toSettle.map(({ match, market }) => (
              <li
                key={market.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-700 bg-ink-900/60 p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{market.title}</div>
                  <div className="truncate text-xs text-ink-400">
                    {match.home.short} v {match.away.short} · {match.league}
                  </div>
                </div>
                <button
                  onClick={() => setSettleTarget({ match, market })}
                  className="btn-primary shrink-0 px-3 py-1.5 text-xs"
                >
                  Settle
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Balance" value={`${formatMoney(balance)} PC`} />
        <StatCard
          label="Lifetime Profit"
          value={`${stats.profit >= 0 ? "+" : ""}${formatMoney(stats.profit)} PC`}
          tone={stats.profit > 0 ? "win" : stats.profit < 0 ? "loss" : "neutral"}
        />
        <StatCard
          label="ROI"
          value={`${(stats.roi * 100).toFixed(1)}%`}
          tone={stats.roi > 0 ? "win" : stats.roi < 0 ? "loss" : "neutral"}
        />
        <StatCard
          label="Win Rate"
          value={`${(stats.winRate * 100).toFixed(0)}%`}
          sub={`${stats.wins}W · ${stats.losses}L`}
        />
      </div>

      {/* Chart + secondary stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Profit Curve</h2>
            <span className="text-xs text-ink-400">{stats.settledBets} settled bets</span>
          </div>
          <ProfitChart points={curve} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatCard
            label="Current Streak"
            value={
              stats.currentStreak === 0
                ? "—"
                : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? "W" : "L"}`
            }
            tone={stats.currentStreak > 0 ? "win" : stats.currentStreak < 0 ? "loss" : "neutral"}
            sub={`Best: ${stats.bestStreak}W`}
          />
          <StatCard label="Biggest Win" value={`+${formatMoney(stats.biggestWin)} PC`} tone="win" />
          <StatCard label="Avg Odds" value={stats.avgOdds ? stats.avgOdds.toFixed(2) : "—"} />
          <StatCard
            label="At Risk (open)"
            value={`${formatMoney(stats.pendingRisk)} PC`}
            sub={`${stats.openBets} open`}
          />
        </div>
      </div>

      {/* Achievements */}
      <section className="card p-5">
        <h2 className="mb-3 font-bold">Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-3 text-center transition-opacity ${
                a.unlocked
                  ? "border-pitch-500/40 bg-pitch-500/10"
                  : "border-ink-700 bg-ink-800/40 opacity-50"
              }`}
            >
              <div className="text-2xl">{a.unlocked ? a.icon : "🔒"}</div>
              <div className="mt-1 text-xs font-semibold">{a.name}</div>
              <div className="mt-0.5 text-[11px] leading-tight text-ink-400">{a.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Bet History</h2>
          <div className="flex gap-1">
            {(["all", "open", "won", "lost"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  filter === f ? "bg-ink-750 text-white" : "text-ink-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-400">No {filter} bets.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "win" | "loss" | "neutral";
}) {
  const color =
    tone === "win" ? "text-pitch-300" : tone === "loss" ? "text-accent-loss" : "text-white";
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

function BetRow({ bet }: { bet: PlacedBet }) {
  const tone =
    bet.status === "won"
      ? "border-pitch-500/40"
      : bet.status === "lost"
        ? "border-accent-loss/30"
        : "border-ink-700";
  const badge =
    bet.status === "won"
      ? "bg-pitch-500/20 text-pitch-300"
      : bet.status === "lost"
        ? "bg-accent-loss/20 text-accent-loss"
        : "bg-ink-700 text-ink-200";

  const net =
    bet.status === "won"
      ? bet.potentialReturn - bet.stake
      : bet.status === "lost"
        ? -bet.stake
        : 0;

  return (
    <div className={`card border ${tone} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${badge}`}>
            {bet.status}
          </span>
          <span className="text-xs text-ink-400">
            {bet.type === "parlay" ? `${bet.legs.length}-leg parlay` : "Single"} ·{" "}
            {relativeTime(bet.placedAt)}
          </span>
          <span className="flex text-xs text-accent-gold">
            {"★".repeat(bet.confidence)}
            <span className="text-ink-600">{"★".repeat(5 - bet.confidence)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-right">
          <ShareBetButton bet={bet} />
          <div>
            <div className="text-sm font-bold tabular-nums">{bet.odds.toFixed(2)}</div>
            <div className="text-[11px] text-ink-400">{toAmerican(bet.odds)}</div>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5">
        {bet.legs.map((leg, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <LegDot status={leg.status} />
              <span className="min-w-0">
                <span className="font-medium">{leg.selectionLabel}</span>
                <span className="ml-1 text-xs text-ink-400">· {leg.matchLabel}</span>
              </span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-ink-300">{leg.price.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-2 text-sm">
        <span className="text-ink-300">
          Stake <span className="font-semibold text-white">{formatMoney(bet.stake)} PC</span>
        </span>
        <span className="text-ink-300">
          {bet.status === "open" ? (
            <>To win <span className="font-semibold text-pitch-300">{formatMoney(bet.potentialReturn)} PC</span></>
          ) : (
            <span
              className={`font-bold tabular-nums ${net >= 0 ? "text-pitch-300" : "text-accent-loss"}`}
            >
              {net >= 0 ? "+" : ""}
              {formatMoney(net)} PC
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function LegDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    won: "bg-pitch-400",
    lost: "bg-accent-loss",
    pending: "bg-ink-500",
    void: "bg-ink-400",
  };
  return <span className={`h-2 w-2 shrink-0 rounded-full ${map[status] ?? "bg-ink-500"}`} />;
}
