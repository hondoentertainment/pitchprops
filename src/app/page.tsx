"use client";

import { useMemo, useState } from "react";
import { useMatches } from "@/components/MatchesProvider";
import { MatchCard } from "@/components/MatchCard";

export default function HomePage() {
  const { matches, source, note, loading, error } = useMatches();
  const [league, setLeague] = useState<string>("all");

  const leagues = useMemo(() => {
    const set = new Map<string, string>();
    matches.forEach((m) => set.set(m.leagueKey, m.league));
    return Array.from(set, ([key, name]) => ({ key, name }));
  }, [matches]);

  const filtered = useMemo(
    () => (league === "all" ? matches : matches.filter((m) => m.leagueKey === league)),
    [matches, league]
  );

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6">
        <div className="relative z-10 max-w-xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip border-pitch-500/40 text-pitch-300">
              {source === "live" ? "● Live odds" : "● Demo odds"}
            </span>
            <span className="chip">Play money</span>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">Soccer Prop Markets</h1>
          <p className="mt-2 text-sm text-ink-300">
            Build singles & parlays across goals, scorers, shots, cards and corners.
            Every bet is tracked with ROI, streaks and achievements — no real money, all the thrill.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 text-[180px] opacity-10">
          ⚽
        </div>
      </section>

      {note && (
        <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
          {note} Add an <code className="rounded bg-ink-800 px-1">ODDS_API_KEY</code> to load live fixtures.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip active={league === "all"} onClick={() => setLeague("all")}>
          All leagues
        </FilterChip>
        {leagues.map((l) => (
          <FilterChip key={l.key} active={league === l.key} onClick={() => setLeague(l.key)}>
            {l.name}
          </FilterChip>
        ))}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-ink-800/50" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-accent-loss/40 bg-accent-loss/10 px-4 py-3 text-sm text-accent-loss">
          Failed to load matches: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-10 text-center text-ink-400">No matches for this league right now.</p>
      )}
    </div>
  );
}

function FilterChip({
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-pitch-500/40 ${
        active
          ? "bg-pitch-500 text-white"
          : "border border-ink-600 bg-ink-750 text-ink-300 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
