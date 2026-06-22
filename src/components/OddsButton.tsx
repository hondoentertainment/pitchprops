"use client";

import { useStore } from "@/lib/store";
import type { Market, Match, Selection } from "@/lib/types";

export function OddsButton({
  match,
  market,
  selection,
  showLabel = true,
}: {
  match: Match;
  market: Market;
  selection: Selection;
  showLabel?: boolean;
}) {
  const addLeg = useStore((s) => s.addLeg);
  const removeLeg = useStore((s) => s.removeLeg);
  const key = selectionKey(match, market, selection);
  const active = useStore((s) => s.slip.some((l) => l.selectionId === key));

  const label = selectionText(selection);
  const ariaLabel = active
    ? `Remove ${label} at ${selection.price.toFixed(2)} from slip`
    : `Add ${label} at ${selection.price.toFixed(2)} to slip`;

  const toggle = () => {
    if (active) {
      removeLeg(key);
      return;
    }
    addLeg({
      matchId: match.id,
      matchLabel: `${match.home.short} v ${match.away.short}`,
      league: match.league,
      commenceTime: match.commenceTime,
      marketId: market.id,
      marketTitle: market.title,
      selectionId: key,
      selectionLabel: label,
      price: selection.price,
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-active={active}
      aria-pressed={active}
      aria-label={ariaLabel}
      className="odds-btn min-h-11 min-w-[84px]"
    >
      {showLabel && (
        <span className="line-clamp-1 text-xs font-medium text-ink-200">
          {selection.label}
          {selection.sublabel ? <span className="text-ink-400"> {selection.sublabel}</span> : null}
        </span>
      )}
      <span className="text-sm font-bold tabular-nums text-pitch-300">
        {selection.price.toFixed(2)}
      </span>
    </button>
  );
}

export function selectionKey(match: Match, market: Market, sel: Selection): string {
  return `${match.id}::${market.id}::${sel.id}`;
}

function selectionText(sel: Selection): string {
  return sel.sublabel ? `${sel.label} ${sel.sublabel}` : sel.label;
}
