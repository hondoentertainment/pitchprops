import { describe, it, expect } from "vitest";
import { buildMockEvents } from "@/lib/mock-events";
import type { Match } from "@/lib/types";

const match: Match = {
  id: "mock_test",
  league: "EPL",
  leagueKey: "soccer_epl",
  home: { name: "Arsenal", short: "ARS" },
  away: { name: "Chelsea", short: "CHE" },
  commenceTime: "2025-06-01T15:00:00Z",
  markets: [
    {
      id: "anytime_scorer",
      title: "Anytime Goalscorer",
      category: "player_goals",
      group: "players",
      selections: [{ id: "s0", label: "Erling Haaland", price: 2.1 }],
    },
  ],
};

describe("buildMockEvents", () => {
  it("produces deterministic event stats", () => {
    const a = buildMockEvents(match, 2, 1);
    const b = buildMockEvents(match, 2, 1);
    expect(a).toEqual(b);
    expect(a.scorers.length).toBe(3);
    expect(a.corners).toBeGreaterThan(0);
    expect(a.cards).toBeGreaterThan(0);
  });
});
