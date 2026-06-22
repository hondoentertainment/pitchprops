import { describe, it, expect } from "vitest";
import { suggestWinners } from "@/lib/grade";
import type { Market, MarketCategory, MatchScore, Selection } from "@/lib/types";

const TEAMS = {
  home: { name: "Arsenal", short: "ARS" },
  away: { name: "Chelsea", short: "CHE" },
};

function market(category: MarketCategory, selections: Selection[]): Market {
  return { id: "custom_x", title: "t", category, group: "specials", selections };
}

function score(home: number, away: number, completed = true): MatchScore {
  return { matchId: "m", home, away, completed };
}

describe("suggestWinners — match result", () => {
  const m = market("match", [
    { id: "home", label: "Arsenal", price: 2 },
    { id: "draw", label: "Draw", price: 3 },
    { id: "away", label: "Chelsea", price: 4 },
  ]);

  it("picks the home team on a home win", () => {
    expect(suggestWinners(m, score(2, 1), TEAMS)).toEqual(["home"]);
  });

  it("picks the draw on a level score", () => {
    expect(suggestWinners(m, score(1, 1), TEAMS)).toEqual(["draw"]);
  });

  it("picks the away team on an away win", () => {
    expect(suggestWinners(m, score(0, 2), TEAMS)).toEqual(["away"]);
  });
});

describe("suggestWinners — totals & BTTS", () => {
  it("grades over/under against the total goals", () => {
    const m = market("goals", [
      { id: "o", label: "Over", sublabel: "2.5", price: 1.9 },
      { id: "u", label: "Under", sublabel: "2.5", price: 1.9 },
    ]);
    expect(suggestWinners(m, score(2, 1), TEAMS)).toEqual(["o"]);
    expect(suggestWinners(m, score(1, 0), TEAMS)).toEqual(["u"]);
  });

  it("grades both-teams-to-score", () => {
    const m = market("goals", [
      { id: "yes", label: "Yes", price: 1.8 },
      { id: "no", label: "No", price: 2 },
    ]);
    expect(suggestWinners(m, score(2, 1), TEAMS)).toEqual(["yes"]);
    expect(suggestWinners(m, score(3, 0), TEAMS)).toEqual(["no"]);
  });
});

describe("suggestWinners — correct score", () => {
  it("matches the exact scoreline (en-dash or hyphen)", () => {
    const m = market("score", [
      { id: "a", label: "2–1", price: 7 },
      { id: "b", label: "1-1", price: 8 },
    ]);
    expect(suggestWinners(m, score(2, 1), TEAMS)).toEqual(["a"]);
    expect(suggestWinners(m, score(0, 0), TEAMS)).toEqual([]);
  });
});

describe("suggestWinners — non-derivable", () => {
  it("returns null for player props", () => {
    const m = market("player_goals", [{ id: "p", label: "Saka", sublabel: "Anytime", price: 2.5 }]);
    expect(suggestWinners(m, score(2, 1), TEAMS)).toBeNull();
  });
});
