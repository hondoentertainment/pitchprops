"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useMatches } from "@/components/MatchesProvider";
import { impliedProbability, toAmerican } from "@/lib/format";
import {
  CATEGORY_LABELS,
  CUSTOM_MARKET_PREFIX,
  groupForCategory,
  MARKET_CATEGORIES,
  type Market,
  type MarketCategory,
  type Match,
  type Selection,
} from "@/lib/types";

interface DraftSelection {
  label: string;
  sublabel: string;
  price: string;
}

function emptySelection(): DraftSelection {
  return { label: "", sublabel: "", price: "" };
}

export function CreatePropForm({ match, onClose }: { match?: Match; onClose: () => void }) {
  const addCustomMarket = useStore((s) => s.addCustomMarket);
  const { matches } = useMatches();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MarketCategory>("match");
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const activeMatch = useMemo(
    () => match ?? matches.find((m) => m.id === selectedMatchId),
    [match, matches, selectedMatchId]
  );
  const [selections, setSelections] = useState<DraftSelection[]>([
    emptySelection(),
    emptySelection(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateSelection = (index: number, patch: Partial<DraftSelection>) => {
    setSelections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addRow = () => setSelections((prev) => [...prev, emptySelection()]);

  const removeRow = (index: number) =>
    setSelections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const onSubmit = () => {
    setError(null);

    if (!activeMatch) {
      setError("Pick a match for this prop.");
      return;
    }
    if (!title.trim()) {
      setError("Give the prop a title.");
      return;
    }

    const cleaned: Selection[] = [];
    for (let i = 0; i < selections.length; i++) {
      const row = selections[i];
      const label = row.label.trim();
      const price = Number(row.price);
      const hasAny = label || row.sublabel.trim() || row.price.trim();
      if (!hasAny) continue; // skip fully-empty rows
      if (!label) {
        setError(`Selection ${i + 1} needs a label.`);
        return;
      }
      if (!Number.isFinite(price) || price <= 1) {
        setError(`Selection "${label}" needs decimal odds greater than 1.00.`);
        return;
      }
      cleaned.push({
        id: `s${i}`,
        label,
        sublabel: row.sublabel.trim() || undefined,
        price: Math.round(price * 100) / 100,
      });
    }

    if (cleaned.length === 0) {
      setError("Add at least one selection with a label and odds.");
      return;
    }

    const market: Market = {
      id: `${CUSTOM_MARKET_PREFIX}${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
      title: title.trim(),
      category,
      group: groupForCategory(category),
      selections: cleaned,
    };

    const res = addCustomMarket(activeMatch, market);
    if (!res.ok) {
      setError(res.error || "Could not create prop.");
      return;
    }
    onClose();
  };

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 animate-slide-up rounded-xl border border-pitch-500/50 bg-ink-800 px-4 py-3 text-sm font-medium text-white shadow-glow">
          {toast}
        </div>
      )}

      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div
          className="card relative w-full max-w-lg p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Create a prop</h2>
              <p className="text-xs text-ink-400">
                {activeMatch
                  ? `${activeMatch.home.name} v ${activeMatch.away.name}`
                  : "Pick a match below"}
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

          <div className="space-y-4">
            {!match && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-400">Match</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-pitch-500"
                >
                  <option value="">Select a match…</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.home.name} v {m.away.name} · {m.league}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Market title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Total Goals, Anytime Goalscorer"
                className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-pitch-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketCategory)}
                className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-pitch-500"
              >
                {MARKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-ink-400">Selections</label>
                <span className="text-[11px] text-ink-500">Decimal odds (e.g. 1.91)</span>
              </div>
              <div className="space-y-2">
                {selections.map((row, i) => {
                  const priceNum = Number(row.price);
                  const showAmerican = Number.isFinite(priceNum) && priceNum > 1;
                  return (
                    <div key={i} className="rounded-xl border border-ink-700 bg-ink-900/60 p-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          value={row.label}
                          onChange={(e) => updateSelection(i, { label: e.target.value })}
                          placeholder="Label (e.g. Over 2.5)"
                          className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm outline-none focus:border-pitch-500"
                        />
                        <div className="relative w-24 shrink-0">
                          <input
                            value={row.price}
                            onChange={(e) => updateSelection(i, { price: e.target.value })}
                            inputMode="decimal"
                            placeholder="Odds"
                            className="w-full rounded-lg border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-pitch-500"
                          />
                        </div>
                        <button
                          onClick={() => removeRow(i)}
                          disabled={selections.length <= 1}
                          className="shrink-0 rounded-lg px-2 py-1 text-ink-400 hover:text-accent-loss disabled:opacity-30"
                          aria-label="Remove selection"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={row.sublabel}
                          onChange={(e) => updateSelection(i, { sublabel: e.target.value })}
                          placeholder="Sub-label (optional, e.g. 2.5 or Anytime)"
                          className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-xs text-ink-300 outline-none focus:border-pitch-500"
                        />
                        {showAmerican && (
                          <span className="shrink-0 rounded-md bg-ink-750 px-2 py-1 text-[11px] font-semibold tabular-nums text-pitch-300">
                            {toAmerican(priceNum)} · {(impliedProbability(priceNum) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={addRow}
                className="mt-2 w-full rounded-lg border border-dashed border-ink-600 py-2 text-xs font-semibold text-ink-300 hover:border-pitch-500 hover:text-white"
              >
                + Add selection
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-accent-loss/40 bg-accent-loss/10 px-3 py-2 text-xs text-accent-loss">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={onSubmit} className="btn-primary flex-1">
                Create prop
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
