"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useMatches } from "@/components/MatchesProvider";
import { CreatePropForm } from "@/components/CreatePropForm";
import { SettlePropForm } from "@/components/SettlePropForm";
import { CATEGORY_LABELS, type Market, type Match } from "@/lib/types";
import { formatKickoff } from "@/lib/format";

interface PropGroup {
  match: Match;
  markets: Market[];
}

export default function PropsPage() {
  const hydrated = useStore((s) => s.hydrated);
  const customMarkets = useStore((s) => s.customMarkets);
  const customMatchMeta = useStore((s) => s.customMatchMeta);
  const results = useStore((s) => s.customMarketResults);
  const bets = useStore((s) => s.bets);
  const removeCustomMarket = useStore((s) => s.removeCustomMarket);
  const autoSettleProps = useStore((s) => s.autoSettleProps);
  const setAutoSettleProps = useStore((s) => s.setAutoSettleProps);
  const { matches } = useMatches();

  const [creating, setCreating] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ match: Match; market: Market } | null>(null);

  const groups = useMemo<PropGroup[]>(() => {
    const out: PropGroup[] = [];
    for (const [matchId, markets] of Object.entries(customMarkets)) {
      if (!markets.length) continue;
      const live = matches.find((m) => m.id === matchId);
      const meta = customMatchMeta[matchId];
      const match: Match = live ?? {
        id: matchId,
        league: meta?.league ?? "Unknown",
        leagueKey: meta?.leagueKey ?? "",
        home: meta?.home ?? { name: "Home", short: "H" },
        away: meta?.away ?? { name: "Away", short: "A" },
        commenceTime: meta?.commenceTime ?? new Date().toISOString(),
        markets: [],
      };
      out.push({ match, markets });
    }
    return out.sort(
      (a, b) => +new Date(a.match.commenceTime) - +new Date(b.match.commenceTime)
    );
  }, [customMarkets, customMatchMeta, matches]);

  const openBetsByMarket = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const bet of bets) {
      if (bet.status !== "open") continue;
      for (const leg of bet.legs) counts[leg.marketId] = (counts[leg.marketId] ?? 0) + 1;
    }
    return counts;
  }, [bets]);

  const total = groups.reduce((n, g) => n + g.markets.length, 0);

  if (!hydrated) {
    return <div className="card h-64 animate-pulse bg-ink-800/50" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Props</h1>
          <p className="text-sm text-ink-300">
            {total === 0
              ? "Props you create live here."
              : `${total} custom prop${total > 1 ? "s" : ""} across ${groups.length} match${
                  groups.length > 1 ? "es" : ""
                }.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={autoSettleProps}
            onClick={() => setAutoSettleProps(!autoSettleProps)}
            className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-750 px-3 py-2 text-xs font-semibold text-ink-200 hover:border-ink-500"
            title="Automatically grade score-based props from the final score"
          >
            <span
              className={`relative h-4 w-7 rounded-full transition-colors ${
                autoSettleProps ? "bg-pitch-500" : "bg-ink-600"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                  autoSettleProps ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
            Auto-settle from score
          </button>
          <button onClick={() => setCreating(true)} className="btn-primary text-sm">
            + New prop
          </button>
        </div>
      </div>

      {creating && <CreatePropForm onClose={() => setCreating(false)} />}
      {settleTarget && (
        <SettlePropForm
          match={settleTarget.match}
          market={settleTarget.market}
          onClose={() => setSettleTarget(null)}
        />
      )}

      {total === 0 ? (
        <div className="card p-10 text-center">
          <div className="mb-3 text-5xl">🧩</div>
          <h2 className="text-xl font-bold">No custom props yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-300">
            Build your own markets — pick a match, add selections with your own odds, then bet and
            settle them from real game results.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary mt-5 inline-flex">
            Create your first prop
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ match, markets }) => (
            <section key={match.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">
                    {match.home.name} <span className="text-ink-500">v</span> {match.away.name}
                  </h2>
                  <p className="text-xs text-ink-400">
                    {match.league} · {formatKickoff(match.commenceTime)}
                  </p>
                </div>
                <Link
                  href={`/match/${encodeURIComponent(match.id)}`}
                  className="shrink-0 text-xs font-semibold text-pitch-400 hover:text-pitch-300"
                >
                  Open match →
                </Link>
              </div>

              <ul className="space-y-3">
                {markets.map((market) => {
                  const result = results[market.id];
                  const winnerLabels =
                    result && result.status === "graded"
                      ? market.selections
                          .filter((sel) =>
                            result.winningSelectionIds.includes(`${match.id}::${market.id}::${sel.id}`)
                          )
                          .map((sel) => sel.label)
                      : [];
                  const openCount = openBetsByMarket[market.id] ?? 0;

                  return (
                    <li key={market.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{market.title}</span>
                        <span className="chip">{CATEGORY_LABELS[market.category]}</span>
                        <StatusBadge result={result} winners={winnerLabels} />
                        {openCount > 0 && (
                          <span className="text-xs text-ink-400">
                            {openCount} open bet{openCount > 1 ? "s" : ""}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => setSettleTarget({ match, market })}
                            className="rounded-lg border border-ink-600 bg-ink-750 px-2.5 py-1 text-xs font-semibold text-ink-200 hover:border-pitch-500 hover:text-white"
                          >
                            {result ? "Edit result" : "Settle"}
                          </button>
                          <button
                            onClick={() => removeCustomMarket(match.id, market.id)}
                            className="rounded-lg px-2 py-1 text-xs text-ink-400 hover:text-accent-loss"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {market.selections.map((sel) => {
                          const won = winnerLabels.length > 0 && winnerLabels.includes(sel.label);
                          return (
                            <span
                              key={sel.id}
                              className={`rounded-lg border px-2 py-1 text-xs ${
                                won
                                  ? "border-pitch-400/60 bg-pitch-500/15 text-pitch-200"
                                  : "border-ink-700 bg-ink-800 text-ink-300"
                              }`}
                            >
                              {sel.label}
                              {sel.sublabel ? <span className="text-ink-500"> {sel.sublabel}</span> : null}
                              <span className="ml-1 font-bold tabular-nums text-pitch-300">
                                {sel.price.toFixed(2)}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  result,
  winners,
}: {
  result: { status: "graded" | "void" } | undefined;
  winners: string[];
}) {
  if (!result) {
    return (
      <span className="rounded-md bg-accent-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase text-accent-gold">
        Awaiting result
      </span>
    );
  }
  if (result.status === "void") {
    return (
      <span className="rounded-md bg-ink-700 px-2 py-0.5 text-[11px] font-bold uppercase text-ink-200">
        Void
      </span>
    );
  }
  return (
    <span className="rounded-md bg-pitch-500/20 px-2 py-0.5 text-[11px] font-bold uppercase text-pitch-300">
      Graded{winners.length ? `: ${winners.join(", ")}` : ""}
    </span>
  );
}
