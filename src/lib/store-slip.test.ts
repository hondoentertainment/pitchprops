import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/lib/store";
import { STARTING_BALANCE } from "@/lib/format";
import type { BetLeg } from "@/lib/types";

function sampleLeg(overrides: Partial<BetLeg> = {}): BetLeg {
  return {
    matchId: "m1",
    matchLabel: "ARS v CHE",
    league: "EPL",
    commenceTime: "2025-06-01T15:00:00Z",
    marketId: "1x2",
    marketTitle: "Match Result",
    selectionId: "m1::1x2::home",
    selectionLabel: "Home",
    price: 2.1,
    ...overrides,
  };
}

function resetStore() {
  useStore.setState({
    balance: STARTING_BALANCE,
    slip: [],
    bets: [],
    notifications: [],
    customMarkets: {},
    customMatchMeta: {},
    customMarketResults: {},
    slipOpen: false,
    hydrated: true,
  });
}

describe("slip interactions", () => {
  beforeEach(resetStore);

  it("adds a leg and opens the slip", () => {
    useStore.getState().addLeg(sampleLeg());
    const { slip, slipOpen } = useStore.getState();
    expect(slip).toHaveLength(1);
    expect(slipOpen).toBe(true);
  });

  it("does not duplicate the same selection", () => {
    const leg = sampleLeg();
    useStore.getState().addLeg(leg);
    useStore.getState().addLeg(leg);
    expect(useStore.getState().slip).toHaveLength(1);
  });

  it("replaces conflicting picks from the same market", () => {
    useStore.getState().addLeg(sampleLeg({ selectionId: "m1::1x2::home", selectionLabel: "Home" }));
    useStore.getState().addLeg(sampleLeg({ selectionId: "m1::1x2::away", selectionLabel: "Away" }));
    const slip = useStore.getState().slip;
    expect(slip).toHaveLength(1);
    expect(slip[0].selectionLabel).toBe("Away");
  });

  it("allows legs from different markets on the same match (parlay)", () => {
    useStore.getState().addLeg(sampleLeg({ marketId: "1x2", selectionId: "m1::1x2::home" }));
    useStore.getState().addLeg(
      sampleLeg({ marketId: "totals", selectionId: "m1::totals::over", marketTitle: "Total Goals" })
    );
    expect(useStore.getState().slip).toHaveLength(2);
  });

  it("removeLeg drops a selection", () => {
    useStore.getState().addLeg(sampleLeg());
    useStore.getState().removeLeg("m1::1x2::home");
    expect(useStore.getState().slip).toHaveLength(0);
  });

  it("placeBet debits balance and clears slip", () => {
    useStore.getState().addLeg(sampleLeg());
    const res = useStore.getState().placeBet({ stake: 50, confidence: 4 });
    expect(res.ok).toBe(true);
    expect(useStore.getState().balance).toBe(STARTING_BALANCE - 50);
    expect(useStore.getState().slip).toHaveLength(0);
    expect(useStore.getState().bets).toHaveLength(1);
    expect(useStore.getState().bets[0].confidence).toBe(4);
  });

  it("placeBet rejects stake above balance", () => {
    useStore.getState().addLeg(sampleLeg());
    const res = useStore.getState().placeBet({ stake: STARTING_BALANCE + 1, confidence: 3 });
    expect(res.ok).toBe(false);
    expect(useStore.getState().bets).toHaveLength(0);
  });

  it("settleDueBets pushes a toast when a bet resolves", () => {
    useStore.getState().addLeg(sampleLeg());
    useStore.getState().placeBet({ stake: 25, confidence: 3 });
    const bet = useStore.getState().bets[0];
    useStore.setState({
      bets: [{ ...bet, resolveAt: new Date(Date.now() - 60_000).toISOString() }],
    });

    const count = useStore.getState().settleDueBets();
    expect(count).toBe(1);
    expect(useStore.getState().notifications.length).toBeGreaterThan(0);
    expect(useStore.getState().bets[0].status).not.toBe("open");
  });
});
