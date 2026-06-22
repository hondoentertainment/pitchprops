"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMatches } from "@/components/MatchesProvider";
import { OddsButton } from "@/components/OddsButton";
import { CreatePropForm } from "@/components/CreatePropForm";
import { SettlePropForm } from "@/components/SettlePropForm";
import { useStore } from "@/lib/store";
import { formatKickoff } from "@/lib/format";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  isCustomMarket,
  isPlayerCategory,
  type Market,
  type MarketGroup,
  type Match,
} from "@/lib/types";

export default function MatchPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id));
  const { matches, loading } = useMatches();
  const match = matches.find((m) => m.id === id);

  const groups = useMemo(() => {
    if (!match) return [] as MarketGroup[];
    const present = new Set(match.markets.map((m) => m.group));
    return GROUP_ORDER.filter((g) => present.has(g));
  }, [match]);

  const [tab, setTab] = useState<MarketGroup | "all">("all");
  const [creating, setCreating] = useState(false);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-ink-800/50" />;
  }

  if (!match) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-300">This match is no longer available.</p>
        <Link href="/" className="btn-ghost mt-4 inline-flex">
          ← Back to matches
        </Link>
      </div>
    );
  }

  const visibleMarkets =
    tab === "all" ? match.markets : match.markets.filter((m) => m.group === tab);
  const propCount = match.markets.reduce((n, m) => n + m.selections.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-400 hover:text-white">
          ← All matches
        </Link>
        <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-xs">
          + New prop
        </button>
      </div>

      {creating && <CreatePropForm match={match} onClose={() => setCreating(false)} />}

      <section className="card p-6">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="chip">{match.league}</span>
          <span className="text-ink-400">{formatKickoff(match.commenceTime)}</span>
        </div>
        <div className="flex items-center justify-center gap-6 py-2 text-center">
          <Team name={match.home.name} short={match.home.short} />
          <span className="text-sm font-bold text-ink-500">VS</span>
          <Team name={match.away.name} short={match.away.short} />
        </div>
        <p className="mt-3 text-center text-xs text-ink-400">
          {match.markets.length} markets · {propCount} selections
        </p>
      </section>

      {/* Group tabs */}
      <div className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-ink-700 bg-ink-900/80 px-4 py-2 backdrop-blur">
        <div className="flex gap-1">
          <Tab active={tab === "all"} onClick={() => setTab("all")}>
            All
          </Tab>
          {groups.map((g) => (
            <Tab key={g} active={tab === g} onClick={() => setTab(g)}>
              {GROUP_LABELS[g]}
            </Tab>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleMarkets.map((market) => (
          <MarketSection key={market.id} market={market} match={match} />
        ))}
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-pitch-500 text-white" : "text-ink-300 hover:bg-ink-750 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Team({ name, short }: { name: string; short: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-700 text-base font-bold text-ink-100">
        {short}
      </span>
      <span className="max-w-[8rem] text-sm font-semibold">{name}</span>
    </div>
  );
}

function MarketSection({ market, match }: { market: Market; match: Match }) {
  const isPlayer = isPlayerCategory(market.category);
  const isCustom = isCustomMarket(market.id);
  const removeCustomMarket = useStore((s) => s.removeCustomMarket);
  const result = useStore((s) => s.customMarketResults[market.id]);
  const [settling, setSettling] = useState(false);

  const winnerLabels =
    result && result.status === "graded"
      ? market.selections
          .filter((sel) => result.winningSelectionIds.includes(`${match.id}::${market.id}::${sel.id}`))
          .map((sel) => sel.label)
      : [];

  return (
    <section className="card p-4">
      {settling && (
        <SettlePropForm match={match} market={market} onClose={() => setSettling(false)} />
      )}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-bold">{market.title}</h2>
        {isPlayer && <span className="chip text-pitch-300">Player prop</span>}
        {isCustom && <span className="chip text-accent-gold">Custom</span>}
        {isCustom && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSettling(true)}
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
        )}
      </div>

      {isCustom && result && (
        <div className="mb-3 rounded-lg border border-pitch-500/30 bg-pitch-500/10 px-3 py-2 text-xs">
          {result.status === "void" ? (
            <span className="text-ink-200">Result: Void / Push</span>
          ) : (
            <span className="text-ink-200">
              Result: <span className="font-semibold text-pitch-300">{winnerLabels.join(", ") || "—"}</span>{" "}
              won
            </span>
          )}
          {result.source === "auto" && <span className="ml-2 text-ink-500">· auto from score</span>}
        </div>
      )}

      {isPlayer ? (
        <ul className="divide-y divide-ink-700">
          {market.selections.map((sel) => (
            <li key={sel.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="text-sm font-semibold">{sel.label}</div>
                {sel.sublabel && <div className="text-xs text-ink-400">{sel.sublabel}</div>}
              </div>
              <OddsButton match={match} market={market} selection={sel} showLabel={false} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {market.selections.map((sel) => (
            <OddsButton key={sel.id} match={match} market={market} selection={sel} showLabel />
          ))}
        </div>
      )}
    </section>
  );
}
