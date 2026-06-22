"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useScores } from "@/components/ScoresProvider";
import { suggestWinners } from "@/lib/grade";
import type { Market, Match } from "@/lib/types";

function compositeKey(match: Match, market: Market, selectionId: string): string {
  return `${match.id}::${market.id}::${selectionId}`;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function SettlePropForm({ match, market, onClose }: { match: Match; market: Market; onClose: () => void }) {
  const setResult = useStore((s) => s.setCustomMarketResult);
  const clearResult = useStore((s) => s.clearCustomMarketResult);
  const settleDueBets = useStore((s) => s.settleDueBets);
  const existing = useStore((s) => s.customMarketResults[market.id]);

  const { scoresByMatch } = useScores();
  const score = scoresByMatch[match.id];

  const suggestion = useMemo(() => {
    if (!score || !score.completed) return null;
    return suggestWinners(market, score, { home: match.home, away: match.away });
  }, [score, market, match]);

  const initial = useMemo(() => {
    if (existing) {
      if (existing.status === "void") return { winners: new Set<string>(), isVoid: true };
      const winners = new Set(
        market.selections
          .filter((sel) => existing.winningSelectionIds.includes(compositeKey(match, market, sel.id)))
          .map((sel) => sel.id)
      );
      return { winners, isVoid: false };
    }
    if (suggestion) return { winners: new Set(suggestion), isVoid: false };
    return { winners: new Set<string>(), isVoid: false };
  }, [existing, suggestion, market, match]);

  const [winners, setWinners] = useState<Set<string>>(initial.winners);
  const [isVoid, setIsVoid] = useState(initial.isVoid);
  const [error, setError] = useState<string | null>(null);

  const suggestionSet = useMemo(() => new Set(suggestion ?? []), [suggestion]);

  const toggle = (id: string) => {
    setError(null);
    setWinners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setIsVoid(false);
    setWinners(new Set(suggestion));
  };

  const onSave = () => {
    if (!isVoid && winners.size === 0) {
      setError("Pick the winning selection(s), or mark the prop void.");
      return;
    }
    const winningSelectionIds = isVoid
      ? []
      : [...winners].map((id) => compositeKey(match, market, id));
    const source = !isVoid && suggestion && sameSet(winners, suggestionSet) ? "auto" : "manual";
    setResult({
      marketId: market.id,
      matchId: match.id,
      status: isVoid ? "void" : "graded",
      winningSelectionIds,
      recordedAt: new Date().toISOString(),
      source,
    });
    settleDueBets({
      scores: scoresByMatch,
      teams: { [match.id]: { home: match.home, away: match.away } },
    });
    onClose();
  };

  const onClear = () => {
    clearResult(market.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div className="card relative w-full max-w-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Settle prop</h2>
              <p className="text-xs text-ink-400">
                {market.title} · {match.home.short} v {match.away.short}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-ink-300 hover:bg-ink-750 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Score / suggestion banner */}
          {score && score.completed ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-pitch-500/30 bg-pitch-500/10 px-3 py-2.5 text-sm">
              <span className="text-ink-200">
                Final score{" "}
                <span className="font-bold tabular-nums text-white">
                  {match.home.short} {score.home}–{score.away} {match.away.short}
                </span>
              </span>
              {suggestion ? (
                <button onClick={applySuggestion} className="btn-ghost px-2.5 py-1 text-xs">
                  Use suggestion
                </button>
              ) : (
                <span className="text-xs text-ink-400">No auto-grade for this type</span>
              )}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2.5 text-xs text-ink-400">
              No final score available yet — record the result manually.
            </div>
          )}

          <label className="mb-1 block text-xs font-medium text-ink-400">Winning selection(s)</label>
          <div className="space-y-2">
            {market.selections.map((sel) => {
              const checked = !isVoid && winners.has(sel.id);
              const isSuggested = suggestionSet.has(sel.id);
              return (
                <button
                  key={sel.id}
                  onClick={() => !isVoid && toggle(sel.id)}
                  disabled={isVoid}
                  data-active={checked}
                  className="odds-btn w-full flex-row items-center justify-between disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${
                        checked ? "border-pitch-400 bg-pitch-500 text-white" : "border-ink-500 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="text-sm font-medium text-ink-100">
                      {sel.label}
                      {sel.sublabel ? <span className="text-ink-400"> {sel.sublabel}</span> : null}
                    </span>
                    {isSuggested && (
                      <span className="rounded-md bg-pitch-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-pitch-300">
                        Suggested
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-pitch-300">
                    {sel.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setError(null);
              setIsVoid((v) => !v);
            }}
            data-active={isVoid}
            className="odds-btn mt-2 w-full flex-row items-center justify-between"
          >
            <span className="text-sm font-medium text-ink-100">Void / Push (refund stake)</span>
            <span
              className={`grid h-4 w-4 place-items-center rounded border text-[10px] ${
                isVoid ? "border-pitch-400 bg-pitch-500 text-white" : "border-ink-500 text-transparent"
              }`}
            >
              ✓
            </span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg border border-accent-loss/40 bg-accent-loss/10 px-3 py-2 text-xs text-accent-loss">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {existing && (
              <button onClick={onClear} className="btn-ghost px-3 text-xs text-accent-loss">
                Clear
              </button>
            )}
            <button onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button onClick={onSave} className="btn-primary flex-1">
              Save result
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-500">
            Settles all open bets on this prop. Already-settled bets are unaffected.
          </p>
        </div>
      </div>
    </>
  );
}
