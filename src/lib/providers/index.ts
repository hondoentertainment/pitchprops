import type { Match, MatchScore } from "@/lib/types";
import { getMockMatches, getMockScores } from "./mock";
import { getLiveMatches, getLiveScores } from "./theoddsapi";

export interface MatchesResult {
  matches: Match[];
  source: "live" | "mock";
  note?: string;
}

export interface ScoresResult {
  scores: MatchScore[];
  source: "live" | "mock";
}

function resolveLeagues(): string[] {
  return (process.env.ODDS_LEAGUES || "soccer_epl,soccer_uefa_champs_league")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve matches from the configured provider. Falls back to mock data when
 * no key is set or the live provider returns nothing, so the app always works.
 */
export async function fetchMatches(): Promise<MatchesResult> {
  const provider = (process.env.ODDS_PROVIDER || "theoddsapi").toLowerCase();
  const apiKey = process.env.ODDS_API_KEY?.trim();

  if (provider !== "mock" && apiKey) {
    const leagues = (process.env.ODDS_LEAGUES || "soccer_epl,soccer_uefa_champs_league")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const region = process.env.ODDS_REGION || "eu";

    try {
      const matches = await getLiveMatches({ apiKey, leagues, region });
      if (matches.length) {
        return { matches, source: "live" };
      }
      return {
        matches: getMockMatches(),
        source: "mock",
        note: "Live provider returned no upcoming fixtures; showing demo data.",
      };
    } catch {
      return {
        matches: getMockMatches(),
        source: "mock",
        note: "Live provider error; showing demo data.",
      };
    }
  }

  return {
    matches: getMockMatches(),
    source: "mock",
    note: apiKey ? undefined : "No ODDS_API_KEY set — showing realistic demo data.",
  };
}

/**
 * Resolve recent final scores used to grade/settle props. Live scores are
 * returned as-is (an empty list just means nothing has finished yet); only an
 * error falls back to deterministic demo scores.
 */
export async function fetchScores(): Promise<ScoresResult> {
  const provider = (process.env.ODDS_PROVIDER || "theoddsapi").toLowerCase();
  const apiKey = process.env.ODDS_API_KEY?.trim();

  if (provider !== "mock" && apiKey) {
    try {
      const scores = await getLiveScores({ apiKey, leagues: resolveLeagues() });
      return { scores, source: "live" };
    } catch {
      return { scores: getMockScores(), source: "mock" };
    }
  }

  return { scores: getMockScores(), source: "mock" };
}
