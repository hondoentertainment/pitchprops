"use client";

import { formatBetShare } from "@/lib/share-bet";
import type { PlacedBet } from "@/lib/types";
import { useStore } from "@/lib/store";

export function ShareBetButton({ bet }: { bet: PlacedBet }) {
  const pushNotice = useStore((s) => s.pushNotice);

  const shareText = async () => {
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

  const shareImage = async () => {
    try {
      const res = await fetch("/api/share/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet }),
      });
      if (!res.ok) throw new Error("image failed");
      const blob = await res.blob();
      const file = new File([blob], "pitchprops-bet.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "PitchProps bet" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pitchprops-bet.png";
      a.click();
      URL.revokeObjectURL(url);
      pushNotice({ message: "Bet card downloaded", tone: "info" });
    } catch {
      pushNotice({ message: "Could not create bet card", tone: "loss" });
    }
  };

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => void shareText()}
        aria-label="Share bet as text"
        className="min-h-11 rounded-lg border border-ink-600 bg-ink-750 px-2.5 py-1.5 text-xs font-semibold text-ink-200 hover:border-pitch-500 hover:text-white"
      >
        Text
      </button>
      <button
        type="button"
        onClick={() => void shareImage()}
        aria-label="Share bet as image card"
        className="min-h-11 rounded-lg border border-ink-600 bg-ink-750 px-2.5 py-1.5 text-xs font-semibold text-ink-200 hover:border-pitch-500 hover:text-white"
      >
        Card
      </button>
    </div>
  );
}
