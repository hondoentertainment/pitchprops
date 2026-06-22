import type { CustomMarketResult, LegStatus, MatchScore, PlacedBet } from "@/lib/types";
import { isCustomMarket } from "@/lib/types";
import { combineOdds } from "@/lib/format";
import { gradeProviderLeg, type TeamNames } from "@/lib/grade-provider";

export interface SettleContext {
  /** Recorded outcomes for custom markets, keyed by market id. */
  results: Record<string, CustomMarketResult>;
  /** Outcome generator for provider legs when score grading isn't available. */
  simulateLeg: (price: number) => LegStatus;
  /** Final scores keyed by match id — when present, provider legs grade from real results. */
  scores?: Record<string, MatchScore>;
  /** Team names keyed by match id (required for score grading). */
  teams?: Record<string, TeamNames>;
  /** Current time in ms (defaults to Date.now()). */
  now?: number;
}

export interface SettledOutcome {
  bet: PlacedBet;
  /** Amount credited back to the balance (winnings or refund). */
  realizedReturn: number;
}

/**
 * Grade and settle a single bet. Pure: no store / no Date.now side effects
 * beyond the injected `now`. Returns `null` when the bet can't be settled yet:
 * it's not open, its resolve time hasn't passed, or a custom leg is still
 * awaiting a recorded result.
 */
export function settleBet(bet: PlacedBet, ctx: SettleContext): SettledOutcome | null {
  if (bet.status !== "open") return null;
  const now = ctx.now ?? Date.now();
  if (+new Date(bet.resolveAt) > now) return null;

  function gradeProvider(l: (typeof bet.legs)[0]): LegStatus {
    const score = ctx.scores?.[l.matchId];
    const teams = ctx.teams?.[l.matchId];
    if (score?.completed && teams) {
      const graded = gradeProviderLeg(l, score, teams);
      if (graded) return graded;
    }
    return ctx.simulateLeg(l.price);
  }

  let awaitingResult = false;
  const legs = bet.legs.map((l) => {
    if (isCustomMarket(l.marketId)) {
      const res = ctx.results[l.marketId];
      if (!res) {
        awaitingResult = true;
        return l;
      }
      if (res.status === "void") return { ...l, status: "void" as LegStatus };
      const won = res.winningSelectionIds.includes(l.selectionId);
      return { ...l, status: (won ? "won" : "lost") as LegStatus };
    }
    return { ...l, status: gradeProvider(l) };
  });

  // Wait until every custom leg has a recorded outcome.
  if (awaitingResult) return null;

  const anyLost = legs.some((l) => l.status === "lost");
  const wonLegs = legs.filter((l) => l.status === "won");
  const allVoid = legs.every((l) => l.status === "void");

  let status: PlacedBet["status"];
  let realizedReturn: number;
  if (allVoid) {
    status = "void";
    realizedReturn = bet.stake; // full refund
  } else if (anyLost) {
    status = "lost";
    realizedReturn = 0;
  } else {
    // Won: void legs drop out of the parlay (treated as odds 1.00).
    status = "won";
    const effectiveOdds = combineOdds(wonLegs.map((l) => l.price));
    realizedReturn = Math.round(bet.stake * effectiveOdds * 100) / 100;
  }

  return {
    bet: {
      ...bet,
      legs,
      status,
      potentialReturn:
        status === "won" || status === "void" ? realizedReturn : bet.potentialReturn,
      settledAt: new Date(now).toISOString(),
    },
    realizedReturn,
  };
}

/** Human-readable toast text for a freshly settled bet. */
export function settlementMessage(outcome: SettledOutcome): { message: string; tone: "win" | "loss" | "info" } {
  const { bet, realizedReturn } = outcome;
  const label = bet.type === "parlay" ? `${bet.legs.length}-leg parlay` : "Bet";
  if (bet.status === "won") {
    const net = Math.round((realizedReturn - bet.stake) * 100) / 100;
    return { message: `✅ ${label} won · +${net} PC`, tone: "win" };
  }
  if (bet.status === "void") {
    return { message: `↩︎ ${label} void · ${bet.stake} PC refunded`, tone: "info" };
  }
  return { message: `❌ ${label} lost · -${bet.stake} PC`, tone: "loss" };
}
