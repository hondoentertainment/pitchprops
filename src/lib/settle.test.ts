import { describe, it, expect } from "vitest";
import { settleBet, type SettleContext } from "@/lib/settle";
import type { BetLeg, CustomMarketResult, LegStatus, PlacedBet } from "@/lib/types";

const NOW = Date.parse("2025-01-01T12:00:00Z");
const PAST = "2025-01-01T09:00:00Z";
const FUTURE = "2025-01-02T00:00:00Z";

function leg(marketId: string, selectionId: string, price: number): BetLeg & { status: LegStatus } {
  return {
    matchId: "m1",
    matchLabel: "ARS v CHE",
    league: "EPL",
    commenceTime: PAST,
    marketId,
    marketTitle: "Market",
    selectionId,
    selectionLabel: "Sel",
    price,
    status: "pending",
  };
}

function bet(overrides: Partial<PlacedBet> = {}): PlacedBet {
  const legs = overrides.legs ?? [leg("1x2", "m1::1x2::home", 2)];
  return {
    id: "bet_1",
    legs,
    type: legs.length > 1 ? "parlay" : "single",
    stake: 100,
    odds: 2,
    potentialReturn: 200,
    status: "open",
    placedAt: PAST,
    confidence: 3,
    resolveAt: PAST,
    ...overrides,
  };
}

const ctx = (over: Partial<SettleContext> = {}): SettleContext => ({
  results: {},
  simulateLeg: () => "won",
  now: NOW,
  ...over,
});

describe("settleBet — gating", () => {
  it("returns null for a bet that isn't due yet", () => {
    expect(settleBet(bet({ resolveAt: FUTURE }), ctx())).toBeNull();
  });

  it("returns null for an already-settled bet", () => {
    expect(settleBet(bet({ status: "won" }), ctx())).toBeNull();
  });

  it("returns null while a custom leg awaits a recorded result", () => {
    const b = bet({ legs: [leg("custom_1", "m1::custom_1::s0", 2)] });
    expect(settleBet(b, ctx())).toBeNull();
  });
});

describe("settleBet — provider legs", () => {
  it("wins a single and credits stake * odds", () => {
    const out = settleBet(bet(), ctx({ simulateLeg: () => "won" }));
    expect(out?.bet.status).toBe("won");
    expect(out?.realizedReturn).toBe(200);
  });

  it("loses a single and credits nothing", () => {
    const out = settleBet(bet(), ctx({ simulateLeg: () => "lost" }));
    expect(out?.bet.status).toBe("lost");
    expect(out?.realizedReturn).toBe(0);
  });

  it("grades from a final score when scores and teams are provided", () => {
    const b = bet({
      legs: [
        {
          ...leg("1x2", "m1::1x2::home", 2),
          selectionLabel: "Arsenal",
        },
      ],
    });
    const out = settleBet(
      b,
      ctx({
        simulateLeg: () => "lost",
        scores: { m1: { matchId: "m1", home: 2, away: 0, completed: true } },
        teams: { m1: { home: { name: "Arsenal", short: "ARS" }, away: { name: "Chelsea", short: "CHE" } } },
      })
    );
    expect(out?.bet.status).toBe("won");
  });
});

describe("settleBet — custom results", () => {
  const result: CustomMarketResult = {
    marketId: "custom_1",
    matchId: "m1",
    status: "graded",
    winningSelectionIds: ["m1::custom_1::s0"],
    recordedAt: PAST,
    source: "manual",
  };

  it("grades a winning custom selection", () => {
    const b = bet({ legs: [leg("custom_1", "m1::custom_1::s0", 3)], odds: 3, potentialReturn: 300 });
    const out = settleBet(b, ctx({ results: { custom_1: result } }));
    expect(out?.bet.status).toBe("won");
    expect(out?.realizedReturn).toBe(300);
  });

  it("grades a losing custom selection", () => {
    const b = bet({ legs: [leg("custom_1", "m1::custom_1::s1", 3)] });
    const out = settleBet(b, ctx({ results: { custom_1: result } }));
    expect(out?.bet.status).toBe("lost");
  });
});

describe("settleBet — void handling", () => {
  const voidResult: CustomMarketResult = {
    marketId: "custom_1",
    matchId: "m1",
    status: "void",
    winningSelectionIds: [],
    recordedAt: PAST,
    source: "manual",
  };

  it("refunds the stake when every leg is void", () => {
    const b = bet({ legs: [leg("custom_1", "m1::custom_1::s0", 2)] });
    const out = settleBet(b, ctx({ results: { custom_1: voidResult } }));
    expect(out?.bet.status).toBe("void");
    expect(out?.realizedReturn).toBe(100);
  });

  it("drops a void leg from a parlay and pays only the surviving odds", () => {
    const b = bet({
      legs: [leg("1x2", "m1::1x2::home", 2), leg("custom_1", "m1::custom_1::s0", 5)],
      odds: 10,
      potentialReturn: 1000,
    });
    const out = settleBet(b, ctx({ simulateLeg: () => "won", results: { custom_1: voidResult } }));
    expect(out?.bet.status).toBe("won");
    // only the 2.0 provider leg survives → 100 * 2.0
    expect(out?.realizedReturn).toBe(200);
  });
});
