"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { combineOdds, formatMoney, toAmerican } from "@/lib/format";

const QUICK_STAKES = [10, 25, 50, 100];

export function BetSlip() {
  const slip = useStore((s) => s.slip);
  const open = useStore((s) => s.slipOpen);
  const setOpen = useStore((s) => s.setSlipOpen);
  const removeLeg = useStore((s) => s.removeLeg);
  const clearSlip = useStore((s) => s.clearSlip);
  const placeBet = useStore((s) => s.placeBet);
  const pushNotice = useStore((s) => s.pushNotice);
  const balance = useStore((s) => s.balance);

  const [stake, setStake] = useState(25);
  const [confidence, setConfidence] = useState(3);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const odds = useMemo(() => combineOdds(slip.map((l) => l.price)), [slip]);
  const isParlay = slip.length > 1;
  const potential = Math.round(stake * odds * 100) / 100;

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  const onPlace = () => {
    const res = placeBet({ stake, confidence });
    if (res.ok) {
      pushNotice({
        message: `Bet placed · ${formatMoney(stake)} PC to win ${formatMoney(potential)} PC`,
        tone: "info",
      });
      setOpen(false);
    } else {
      pushNotice({ message: res.error || "Could not place bet", tone: "loss" });
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="bet-slip-title"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-700 bg-ink-850 shadow-2xl transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div>
            <h2 id="bet-slip-title" className="text-lg font-bold">
              Bet Slip
            </h2>
            <p className="text-xs text-ink-400">
              {slip.length === 0
                ? "No selections yet"
                : `${slip.length} selection${slip.length > 1 ? "s" : ""} · ${
                    isParlay ? "Parlay" : "Single"
                  }`}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bet slip"
            className="min-h-11 min-w-11 rounded-lg px-2 py-1 text-ink-300 hover:bg-ink-750 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {slip.length === 0 ? (
            <div className="mt-16 text-center text-ink-400">
              <div className="mb-2 text-4xl" aria-hidden>
                🎫
              </div>
              <p className="font-medium text-ink-300">Your slip is empty</p>
              <p className="mt-1 text-sm">Tap any odds to add a selection.</p>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Slip selections">
              {slip.map((leg) => (
                <li key={leg.selectionId} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{leg.selectionLabel}</div>
                      <div className="truncate text-xs text-ink-400">{leg.marketTitle}</div>
                      <div className="mt-1 truncate text-xs text-ink-300">{leg.matchLabel}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-lg bg-ink-750 px-2 py-1 text-sm font-bold tabular-nums text-pitch-300">
                        {leg.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.selectionId)}
                        aria-label={`Remove ${leg.selectionLabel} from slip`}
                        className="min-h-11 px-2 text-xs text-ink-400 hover:text-accent-loss"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {slip.length > 0 && (
          <div className="border-t border-ink-700 bg-ink-800/60 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-ink-300">{isParlay ? "Parlay odds" : "Odds"}</span>
              <span className="font-bold tabular-nums text-white">
                {odds.toFixed(2)}{" "}
                <span className="text-ink-400">({toAmerican(odds)})</span>
              </span>
            </div>

            <label htmlFor="slip-stake" className="mb-1 block text-xs font-medium text-ink-400">
              Stake (PC)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="slip-stake"
                type="number"
                min={1}
                inputMode="numeric"
                value={stake}
                onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                className="min-h-11 w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-base font-semibold tabular-nums outline-none focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
              />
              <button
                type="button"
                onClick={() => setStake(Math.floor(balance))}
                className="btn-ghost min-h-11 whitespace-nowrap px-3 py-2 text-xs"
              >
                Max
              </button>
            </div>
            <div className="mt-2 flex gap-2" role="group" aria-label="Quick stake amounts">
              {QUICK_STAKES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setStake(q)}
                  aria-pressed={stake === q}
                  className="min-h-11 flex-1 rounded-lg border border-ink-600 bg-ink-750 py-1.5 text-xs font-semibold hover:border-pitch-500"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <span id="slip-confidence-label" className="text-xs font-medium text-ink-400">
                  Confidence
                </span>
                <span className="text-xs text-ink-300" aria-live="polite">
                  {confidence}/5
                </span>
              </div>
              <div className="flex gap-1" role="group" aria-labelledby="slip-confidence-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfidence(n)}
                    aria-label={`${n} star confidence`}
                    aria-pressed={n <= confidence}
                    className={`min-h-11 flex-1 rounded-lg py-1.5 text-sm transition-colors ${
                      n <= confidence
                        ? "bg-accent-gold/20 text-accent-gold"
                        : "bg-ink-750 text-ink-500 hover:text-ink-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5">
              <span className="text-sm text-ink-300">Potential return</span>
              <span className="text-base font-bold tabular-nums text-pitch-300">
                {formatMoney(potential)} PC
              </span>
            </div>

            <button
              type="button"
              onClick={onPlace}
              disabled={stake <= 0 || stake > balance}
              className="btn-primary mt-3 min-h-12 w-full text-base"
            >
              {stake > balance ? "Insufficient balance" : `Place ${isParlay ? "Parlay" : "Bet"}`}
            </button>
            <button
              type="button"
              onClick={clearSlip}
              className="mt-2 min-h-11 w-full text-center text-xs text-ink-400 hover:text-accent-loss"
            >
              Clear slip
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
