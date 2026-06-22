"use client";

import Link from "next/link";
import type { Match } from "@/lib/types";
import { formatKickoff } from "@/lib/format";
import { OddsButton } from "@/components/OddsButton";

export function MatchCard({ match }: { match: Match }) {
  const result = match.markets.find((m) => m.id === "1x2");
  const propCount = match.markets.reduce((n, m) => n + m.selections.length, 0);

  return (
    <div className="card group p-4 transition-colors hover:border-ink-600">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="chip">{match.league}</span>
        <span className="text-ink-400">{formatKickoff(match.commenceTime)}</span>
      </div>

      <Link href={`/match/${encodeURIComponent(match.id)}`} className="block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <TeamRow short={match.home.short} name={match.home.name} />
            <TeamRow short={match.away.short} name={match.away.name} />
          </div>
          <span className="text-ink-500 transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </Link>

      {result && (
        <div className="grid grid-cols-3 gap-2">
          {result.selections.map((sel) => (
            <OddsButton
              key={sel.id}
              match={match}
              market={result}
              selection={sel}
              showLabel
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>{match.markets.length} markets · {propCount} props</span>
        <Link href={`/match/${encodeURIComponent(match.id)}`} className="font-semibold text-pitch-400 hover:text-pitch-300">
          All props →
        </Link>
      </div>
    </div>
  );
}

function TeamRow({ short, name }: { short: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-9 place-items-center rounded-md bg-ink-700 text-[11px] font-bold text-ink-200">
        {short}
      </span>
      <span className="font-semibold">{name}</span>
    </div>
  );
}
