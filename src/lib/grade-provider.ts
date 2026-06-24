import type { BetLeg, LegStatus, MatchScore } from "@/lib/types";

export interface TeamNames {
  home: { name: string; short: string };
  away: { name: string; short: string };
}

type Outcome = "home" | "draw" | "away";

function matchOutcome(score: MatchScore): Outcome {
  if (score.home > score.away) return "home";
  if (score.away > score.home) return "away";
  return "draw";
}

function selectionId(leg: BetLeg): string {
  return leg.selectionId.split("::")[2] ?? "";
}

/**
 * Grade a provider (non-custom) leg from a final score when possible.
 * Returns `null` when the market can't be derived from the score alone
 * (player props, HT markets, cards/corners) — caller should simulate.
 */
export function gradeProviderLeg(
  leg: BetLeg,
  score: MatchScore,
  teams: TeamNames
): LegStatus | null {
  if (!score.completed) return null;

  const sel = selectionId(leg);
  const marketId = leg.marketId;
  const total = score.home + score.away;
  const outcome = matchOutcome(score);
  const bothScored = score.home > 0 && score.away > 0;

  switch (marketId) {
    case "1x2":
      if (sel === "home") return outcome === "home" ? "won" : "lost";
      if (sel === "draw") return outcome === "draw" ? "won" : "lost";
      if (sel === "away") return outcome === "away" ? "won" : "lost";
      return null;

    case "double_chance":
      if (sel === "1x") return outcome === "home" || outcome === "draw" ? "won" : "lost";
      if (sel === "12") return outcome !== "draw" ? "won" : "lost";
      if (sel === "x2") return outcome === "draw" || outcome === "away" ? "won" : "lost";
      return null;

    case "dnb":
      if (outcome === "draw") return "void";
      if (sel === "dnb_home") return outcome === "home" ? "won" : "lost";
      if (sel === "dnb_away") return outcome === "away" ? "won" : "lost";
      return null;

    case "btts":
      if (sel === "btts_yes") return bothScored ? "won" : "lost";
      if (sel === "btts_no") return !bothScored ? "won" : "lost";
      return null;

    case "odd_even":
      if (sel === "odd") return total % 2 === 1 ? "won" : "lost";
      if (sel === "even") return total % 2 === 0 ? "won" : "lost";
      return null;

    case "win_to_nil":
      if (sel === "home") return outcome === "home" && score.away === 0 ? "won" : "lost";
      if (sel === "away") return outcome === "away" && score.home === 0 ? "won" : "lost";
      return null;

    case "exact_goals": {
      const m = sel.match(/^eg_(\d+)$/);
      if (!m) return null;
      const n = Number(m[1]);
      if (n === 3) return total >= 3 ? "won" : "lost";
      return total === n ? "won" : "lost";
    }

    default:
      break;
  }

  const ou = parseOverUnder(sel, leg.selectionLabel);
  if (
    ou &&
    (marketId === "totals" ||
      marketId.startsWith("team_total_") ||
      marketId === "cards" ||
      marketId === "corners")
  ) {
    if (marketId === "cards" || marketId === "corners") return null;
    let value = total;
    if (marketId === "team_total_home") value = score.home;
    else if (marketId === "team_total_away") value = score.away;
    if (ou.dir === "over") return value > ou.line ? "won" : value < ou.line ? "lost" : "void";
    return value < ou.line ? "won" : value > ou.line ? "lost" : "void";
  }

  // Correct score: cs_2_1
  if (marketId === "correct_score") {
    const m = sel.match(/^cs_(\d+)_(\d+)$/);
    if (!m) return null;
    const h = Number(m[1]);
    const a = Number(m[2]);
    return score.home === h && score.away === a ? "won" : "lost";
  }

  // Winning margin
  if (marketId === "winning_margin") {
    const diff = Math.abs(score.home - score.away);
    if (sel === "wm_draw") return outcome === "draw" ? "won" : "lost";
    if (sel === "wm_home1") return outcome === "home" && diff === 1 ? "won" : "lost";
    if (sel === "wm_home2") return outcome === "home" && diff >= 2 ? "won" : "lost";
    if (sel === "wm_away1") return outcome === "away" && diff === 1 ? "won" : "lost";
    if (sel === "wm_away2") return outcome === "away" && diff >= 2 ? "won" : "lost";
    return null;
  }

  // Clean sheet
  if (marketId === "clean_sheet_home") {
    if (sel === "cs_home_yes") return score.away === 0 ? "won" : "lost";
    if (sel === "cs_home_no") return score.away > 0 ? "won" : "lost";
  }
  if (marketId === "clean_sheet_away") {
    if (sel === "cs_away_yes") return score.home === 0 ? "won" : "lost";
    if (sel === "cs_away_no") return score.home > 0 ? "won" : "lost";
  }

  // First to score
  if (marketId === "first_to_score") {
    if (sel === "fts_none") return total === 0 ? "won" : "lost";
    if (!score.events) return null;
    if (sel === "fts_home") return score.events.firstTeam === "home" ? "won" : "lost";
    if (sel === "fts_away") return score.events.firstTeam === "away" ? "won" : "lost";
    return null;
  }

  // Player & bookings markets when event stats are present
  if (score.events) {
    const ev = score.events;
    const nameMatch = (n: string) =>
      leg.selectionLabel.toLowerCase().includes(n.toLowerCase()) ||
      n.toLowerCase().includes(leg.selectionLabel.toLowerCase().split(" ")[0]);

    if (marketId === "anytime_scorer" || marketId === "to_score_2") {
      const goals = ev.scorers.filter((s) => nameMatch(s)).length;
      if (marketId === "anytime_scorer") return goals >= 1 ? "won" : "lost";
      return goals >= 2 ? "won" : "lost";
    }

    if (marketId === "first_scorer") {
      const fs = ev.firstScorer;
      if (!fs) return total === 0 ? "lost" : null;
      return nameMatch(fs) ? "won" : "lost";
    }

    if (marketId === "player_assists") {
      const a = Object.entries(ev.assists).find(([n]) => nameMatch(n))?.[1] ?? 0;
      return a >= 1 ? "won" : "lost";
    }

    if (marketId === "player_cards") {
      return ev.booked.some((n) => nameMatch(n)) ? "won" : "lost";
    }

    if (marketId === "player_sot" || marketId === "player_shots") {
      const sot = Object.entries(ev.shotsOnTarget).find(([n]) => nameMatch(n))?.[1] ?? 0;
      const need = leg.selectionLabel.includes("2+") || sel.includes("sot2") || sel.includes("shots3") ? 2 : 1;
      const val = marketId === "player_sot" ? sot : sot + (ev.scorers.filter((s) => nameMatch(s)).length > 0 ? 1 : 0);
      return val >= need ? "won" : "lost";
    }

    if (marketId === "cards" || marketId === "corners") {
      if (!ou) return null;
      const value = marketId === "cards" ? ev.cards : ev.corners;
      if (ou.dir === "over") return value > ou.line ? "won" : value < ou.line ? "lost" : "void";
      return value < ou.line ? "won" : value > ou.line ? "lost" : "void";
    }
  }

  // Fallback: try label-based match result grading for unknown market ids
  if (marketId === "match" || leg.marketTitle.toLowerCase().includes("result")) {
    const t = leg.selectionLabel.toLowerCase();
    if (/\bdraw\b/.test(t)) return outcome === "draw" ? "won" : "lost";
    if (t.includes(teams.home.name.toLowerCase()) || t.includes(teams.home.short.toLowerCase()) || /\bhome\b/.test(t)) {
      return outcome === "home" ? "won" : "lost";
    }
    if (t.includes(teams.away.name.toLowerCase()) || t.includes(teams.away.short.toLowerCase()) || /\baway\b/.test(t)) {
      return outcome === "away" ? "won" : "lost";
    }
  }

  return null;
}

function parseOverUnder(
  selId: string,
  label: string
): { dir: "over" | "under"; line: number } | null {
  const t = `${selId} ${label}`.toLowerCase();
  const isOver = t.includes("over");
  const isUnder = t.includes("under");
  if (!isOver && !isUnder) return null;
  const lineMatch = t.match(/(\d+(?:\.\d+)?)/);
  if (!lineMatch) return null;
  const line = parseFloat(lineMatch[1]);
  if (!Number.isFinite(line)) return null;
  return { dir: isOver ? "over" : "under", line };
}
