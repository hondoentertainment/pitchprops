"use client";

import { formatBetShare } from "@/lib/share-bet";
import type { PlacedBet } from "@/lib/types";
import { useStore } from "@/lib/store";

export function ShareBetButton({ bet }: { bet: PlacedBet }) {
  const pushNotice = useStore((s) => s.pushNotice);

  const share = async () => {
    const text = formatBetShare(bet);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "PitchProps bet", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      pushNotice({ message: "Bet copied to clipboard", tone: "info" });
    } catch {
      pushNotice({ message: "Could not share bet", tone: "loss" });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label="Share bet"
      className="min-h-11 rounded-lg border border-ink-600 bg-ink-750 px-3 py-1.5 text-xs font-semibold text-ink-200 hover:border-pitch-500 hover:text-white"
    >
      Share
    </button>
  );
}
