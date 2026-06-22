import { describe, it, expect } from "vitest";
import { selectionKey } from "@/components/OddsButton";
import type { Market, Match, Selection } from "@/lib/types";

const match: Match = {
  id: "mock_m1",
  league: "EPL",
  leagueKey: "soccer_epl",
  home: { name: "Arsenal", short: "ARS" },
  away: { name: "Chelsea", short: "CHE" },
  commenceTime: "2025-06-01T15:00:00Z",
  markets: [],
};

const market: Market = {
  id: "1x2",
  title: "Match Result",
  category: "match",
  group: "match",
  selections: [],
};

const selection: Selection = { id: "home", label: "Home", price: 2.05 };

describe("selectionKey", () => {
  it("builds a stable composite id", () => {
    expect(selectionKey(match, market, selection)).toBe("mock_m1::1x2::home");
  });
});
