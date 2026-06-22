import { describe, it, expect } from "vitest";
import { gradeProviderLeg } from "@/lib/grade-provider";
import type { BetLeg, MatchScore } from "@/lib/types";

const teams = {
  home: { name: "Arsenal", short: "ARS" },
  away: { name: "Chelsea", short: "CHE" },
};

function leg(
  marketId: string,
  selId: string,
  label = "Sel"
): BetLeg & { status: "pending" } {
  return {
    matchId: "m1",
    matchLabel: "ARS v CHE",
    league: "EPL",
    commenceTime: "2025-01-01T12:00:00Z",
    marketId,
    marketTitle: "Market",
    selectionId: `m1::${marketId}::${selId}`,
    selectionLabel: label,
    price: 2,
    status: "pending",
  };
}

const score = (home: number, away: number): MatchScore => ({
  matchId: "m1",
  home,
  away,
  completed: true,
});

describe("gradeProviderLeg", () => {
  it("grades 1X2 home win", () => {
    expect(gradeProviderLeg(leg("1x2", "home"), score(2, 1), teams)).toBe("won");
    expect(gradeProviderLeg(leg("1x2", "away"), score(2, 1), teams)).toBe("lost");
  });

  it("grades BTTS", () => {
    expect(gradeProviderLeg(leg("btts", "btts_yes"), score(1, 1), teams)).toBe("won");
    expect(gradeProviderLeg(leg("btts", "btts_no"), score(1, 0), teams)).toBe("won");
  });

  it("grades totals over 2.5", () => {
    expect(gradeProviderLeg(leg("totals", "over_2.5", "Over 2.5"), score(2, 1), teams)).toBe("won");
    expect(gradeProviderLeg(leg("totals", "under_2.5", "Under 2.5"), score(1, 0), teams)).toBe("won");
  });

  it("grades correct score", () => {
    expect(gradeProviderLeg(leg("correct_score", "cs_2_1"), score(2, 1), teams)).toBe("won");
    expect(gradeProviderLeg(leg("correct_score", "cs_0_0"), score(2, 1), teams)).toBe("lost");
  });

  it("returns null for player props", () => {
    expect(gradeProviderLeg(leg("anytime_scorer", "scorer_0", "Haaland"), score(2, 1), teams)).toBeNull();
  });
});
