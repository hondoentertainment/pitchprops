import type { PlacedBet } from "@/lib/types";
import { formatMoney, toAmerican } from "@/lib/format";

/** Plain-text card for sharing a bet result or open slip. */
export function formatBetShare(bet: PlacedBet): string {
  const lines = [
    `⚽ PitchProps ${bet.type === "parlay" ? "Parlay" : "Single"}`,
    `Status: ${bet.status.toUpperCase()} · ${bet.odds.toFixed(2)} (${toAmerican(bet.odds)})`,
    `Stake: ${formatMoney(bet.stake)} PC · Confidence: ${"★".repeat(bet.confidence)}`,
    "",
    ...bet.legs.map(
      (l) =>
        `• ${l.selectionLabel} @ ${l.price.toFixed(2)} — ${l.matchLabel} (${l.marketTitle})${
          l.status !== "pending" ? ` [${l.status}]` : ""
        }`
    ),
  ];
  if (bet.status === "won") {
    lines.push("", `Return: ${formatMoney(bet.potentialReturn)} PC 🎉`);
  } else if (bet.status === "lost") {
    lines.push("", `Lost: -${formatMoney(bet.stake)} PC`);
  } else if (bet.status === "open") {
    lines.push("", `To win: ${formatMoney(bet.potentialReturn)} PC`);
  }
  lines.push("", "Play-money only · pitchprops.app");
  return lines.join("\n");
}
